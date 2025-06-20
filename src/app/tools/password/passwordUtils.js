import { v4 as uuidv4 } from 'uuid';

// Generate random password
export const generatePassword = (length, useUppercase, useLowercase, useNumbers, useSymbols) => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?/';
  let chars = '';
  if (useUppercase) chars += uppercase;
  if (useLowercase) chars += lowercase;
  if (useNumbers) chars += numbers;
  if (useSymbols) chars += symbols;
  if (!chars) return '';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((x) => chars[x % chars.length])
    .join('');
};

// Calculate password strength
export const calculateStrength = (password) => {
  if (!password) return { score: 0, label: 'None' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const labels = ['Weak', 'Weak', 'Moderate', 'Strong', 'Very Strong'];
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)] };
};

// Derive encryption key from master password
export const deriveKey = async (password, salt) => {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const derivedSalt = salt ? new Uint8Array(salt) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: derivedSalt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  return { key, salt: Array.from(derivedSalt) };
};

// Encrypt data
export const encryptData = async (key, data) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  try {
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      enc.encode(JSON.stringify(data))
    );
    return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
  } catch (err) {
    throw new Error('Encryption failed: ' + err.message);
  }
};

// Decrypt data
export const decryptData = async (key, { iv, encrypted }) => {
  const dec = new TextDecoder();
  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      key,
      new Uint8Array(encrypted)
    );
    return JSON.parse(dec.decode(decrypted));
  } catch (err) {
    throw new Error('Decryption failed: ' + err.message);
  }
};

// Unlock vault
export const unlockVault = async (masterPassword) => {
  if (!masterPassword) throw new Error('Master password required');
  const vault = localStorage.getItem('passwordVault');
  console.log('Vault data:', vault); // Debug
  if (!vault) {
    console.log('Initializing new vault');
    const { key, salt } = await deriveKey(masterPassword);
    const encryptedVault = await encryptData(key, []);
    localStorage.setItem('passwordVault', JSON.stringify({ ...encryptedVault, salt }));
    console.log('New vault created:', localStorage.getItem('passwordVault'));
    return true;
  }
  try {
    const { iv, encrypted, salt } = JSON.parse(vault);
    console.log('Parsed vault:', { iv, encrypted, salt }); // Debug
    if (!iv || !encrypted || !salt || salt.every(v => v === 0)) {
      throw new Error('Invalid vault structure or zero salt');
    }
    const { key } = await deriveKey(masterPassword, salt);
    await decryptData(key, { iv, encrypted });
    console.log('Vault unlocked successfully');
    return true;
  } catch (err) {
    console.error('Unlock error:', err.message);
    throw new Error('Invalid master password or vault initialization failed');
  }
};

// Save to vault
export const saveToVault = async (masterPassword, siteName, username, password) => {
  const vault = localStorage.getItem('passwordVault');
  const { iv, encrypted, salt } = JSON.parse(vault);
  const { key } = await deriveKey(masterPassword, salt);
  const entries = await decryptData(key, { iv, encrypted });
  entries.push({ id: uuidv4(), siteName, username, password, createdAt: new Date().toISOString() });
  const newEncryptedVault = await encryptData(key, entries);
  localStorage.setItem('passwordVault', JSON.stringify({ ...newEncryptedVault, salt }));
};

// Get vault entries
export const getVaultEntries = async (masterPassword) => {
  const vault = localStorage.getItem('passwordVault');
  if (!vault) return [];
  const { iv, encrypted, salt } = JSON.parse(vault);
  const { key } = await deriveKey(masterPassword, salt);
  return decryptData(key, { iv, encrypted });
};

// Delete vault entry
export const deleteVaultEntry = async (masterPassword, id) => {
  const vault = localStorage.getItem('passwordVault');
  const { iv, encrypted, salt } = JSON.parse(vault);
  const { key } = await deriveKey(masterPassword, salt);
  let entries = await decryptData(key, { iv, encrypted });
  entries = entries.filter((entry) => entry.id !== id);
  const newEncryptedVault = await encryptData(key, entries);
  localStorage.setItem('passwordVault', JSON.stringify({ ...newEncryptedVault, salt }));
};