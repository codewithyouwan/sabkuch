import { v4 as uuidv4 } from 'uuid';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

// Get public key from Supabase
export const getPublicKey = async () => {
  const { data, error } = await supabase.from('config').select('value').eq('key', 'public_key').single();
  if (error) throw new Error('Failed to fetch public key: ' + error.message);
  return data.value;
};

// Generate user-specific AES-GCM key
export const generateUserKey = async () => {
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Export AES key to binary file
export const exportUserKey = async (key) => {
  const exported = await crypto.subtle.exportKey('raw', key);
  return new Blob([new Uint8Array(exported)], { type: 'application/octet-stream' });
};

// Import AES key from file
export const importUserKey = async (file) => {
  const arrayBuffer = await file.arrayBuffer();
  return crypto.subtle.importKey(
    'raw',
    arrayBuffer,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
};

// Encrypt AES key with public key
export const encryptUserKey = async (publicKeyBase64, userKey) => {
  const publicKeyArray = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  const publicKey = await crypto.subtle.importKey(
    'spki',
    publicKeyArray,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
  const userKeyRaw = await crypto.subtle.exportKey('raw', userKey);
  const encryptedKey = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    userKeyRaw
  );
  return Array.from(new Uint8Array(encryptedKey));
};

// Encrypt password entry
export const encryptData = async (key, data) => {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(JSON.stringify(data))
  );
  return { iv: Array.from(iv), encrypted: Array.from(new Uint8Array(encrypted)) };
};

// Decrypt password entry
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

// Initialize vault (create first password entry with encrypted user key)
export const initializeVault = async (userId, userKey) => {
  const publicKey = await getPublicKey();
  const encryptedUserKey = await encryptUserKey(publicKey, userKey);
  const { error } = await supabase.from('passwords').insert({
    user_id: userId,
    encrypted_entry: { iv: [], encrypted: [], siteName: '', username: '', password: '', encrypted_user_key: encryptedUserKey },
  });
  if (error) throw new Error('Vault initialization failed: ' + error.message);
};

// Unlock vault (verify user key by decrypting any entry)
export const unlockVault = async (userId, userKey) => {
  const { data, error } = await supabase.from('passwords').select('encrypted_entry').eq('user_id', userId).limit(1).single();
  if (error || !data) throw new Error('Vault not found: ' + error?.message);
  const { iv, encrypted } = data.encrypted_entry;
  if (iv.length && encrypted.length) {
    await decryptData(userKey, { iv, encrypted }); // Test decryption
  }
  return true;
};

// Save to vault
export const saveToVault = async (userId, userKey, siteName, username, password) => {
  const encryptedData = await encryptData(userKey, { password, createdAt: new Date().toISOString() });
  const { data: existing, error: fetchError } = await supabase.from('passwords').select('encrypted_entry').eq('user_id', userId).limit(1).single();
  if (fetchError && fetchError.code !== 'PGRST116') throw new Error('Fetch error: ' + fetchError.message);
  const encryptedUserKey = existing ? existing.encrypted_entry.encrypted_user_key : await encryptUserKey(await getPublicKey(), userKey);
  const { error } = await supabase.from('passwords').insert({
    user_id: userId,
    encrypted_entry: { ...encryptedData, siteName, username, encrypted_user_key: encryptedUserKey },
  });
  if (error) throw new Error('Failed to save to vault: ' + error.message);
};

// Get vault entries
export const getVaultEntries = async (userId, userKey) => {
  const { data, error } = await supabase.from('passwords').select('id, encrypted_entry').eq('user_id', userId);
  if (error) throw new Error('Failed to fetch entries: ' + error.message);
  const entries = [];
  for (const { id, encrypted_entry } of data) {
    const { siteName, username, iv, encrypted } = encrypted_entry;
    if (iv.length && encrypted.length) {
      const { password, createdAt } = await decryptData(userKey, { iv, encrypted });
      entries.push({ id, siteName, username, password, createdAt });
    } else {
      entries.push({ id, siteName, username, password: '', createdAt: new Date().toISOString() });
    }
  }
  return entries;
};

// Delete vault entry
export const deleteVaultEntry = async (userId, userKey, id) => {
  const { error } = await supabase.from('passwords').delete().eq('user_id', userId).eq('id', id);
  if (error) throw new Error('Failed to delete entry: ' + error.message);
};