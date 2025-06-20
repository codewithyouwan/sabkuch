
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { generatePassword, calculateStrength, initializeVault, unlockVault, saveToVault, getVaultEntries, deleteVaultEntry, generateUserKey, exportUserKey, importUserKey } from '../../utils/passwordUtils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PasswordManager() {
  const [user, setUser] = useState(null);
  const [vaultInitialized, setVaultInitialized] = useState(null);
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '' });
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [userKey, setUserKey] = useState(null);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultEntries, setVaultEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const router = useRouter();

  // Check JWT token and vault status
  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setLoading(false);
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();
        if (!response.ok || data.message !== 'Token is valid') {
          toast.error(data.error || 'Invalid token');
          localStorage.removeItem('authToken');
          setLoading(false);
          router.push('/login');
          return;
        }
        setUser({ userId: data.userId, email: data.email, name: data.name });
        console.log('User verified:', data);

        // Check vault status
        const { data: vaultData, error } = await supabase.from('passwords').select('id').eq('user_id', data.userId).limit(1);
        if (error && error.code !== 'PGRST116') {
          setError('Failed to check vault status: ' + error.message);
          setLoading(false);
          return;
        }
        setVaultInitialized(!!vaultData.length);
        setLoading(false);
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Network error during verification');
        localStorage.removeItem('authToken');
        setLoading(false);
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  // Generate password on input change
  useEffect(() => {
    if (useUppercase || useLowercase || useNumbers || useSymbols) {
      const password = generatePassword(length, useUppercase, useLowercase, useNumbers, useSymbols);
      setGeneratedPassword(password);
      setStrength(calculateStrength(password));
    } else {
      setGeneratedPassword('');
      setStrength({ score: 0, label: 'None' });
    }
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const handleGenerate = () => {
    if (!useUppercase && !useLowercase && !useNumbers && !useSymbols) {
      setError('Select at least one character type.');
      return;
    }
    const password = generatePassword(length, useUppercase, useLowercase, useNumbers, useSymbols);
    setGeneratedPassword(password);
    setStrength(calculateStrength(password));
    setError('');
  };

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setError('Failed to copy text.');
    }
  };

  const handleInitializeVault = async () => {
    setError('');
    try {
      const key = await generateUserKey();
      await initializeVault(user.userId, key);
      const keyBlob = await exportUserKey(key);
      const url = URL.createObjectURL(keyBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault_key_${user.userId}.bin`;
      a.click();
      URL.revokeObjectURL(url);
      setVaultInitialized(true);
      setUserKey(key);
      setVaultUnlocked(true);
      setVaultEntries([]);
    } catch (err) {
      setError('Vault initialization failed: ' + err.message);
    }
  };

  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setError('');
    if (!fileInputRef.current.files[0]) {
      setError('Please upload your private key file.');
      return;
    }
    try {
      const key = await importUserKey(fileInputRef.current.files[0]);
      await unlockVault(user.userId, key);
      setUserKey(key);
      setVaultUnlocked(true);
      const entries = await getVaultEntries(user.userId, key);
      setVaultEntries(entries);
      fileInputRef.current.value = '';
    } catch (err) {
      setError(err.message || 'Failed to unlock vault.');
    }
  };

  const handleSaveToVault = async (e) => {
    e.preventDefault();
    setError('');
    if (!siteName || !username || !generatedPassword) {
      setError('Please fill in all fields.');
      return;
    }
    try {
      await saveToVault(user.userId, userKey, siteName, username, generatedPassword);
      const entries = await getVaultEntries(user.userId, userKey);
      setVaultEntries(entries);
      setSiteName('');
      setUsername('');
      setGeneratedPassword('');
      setStrength({ score: 0, label: 'None' });
    } catch (err) {
      setError('Failed to save to vault.');
    }
  };

  const handleDeleteEntry = async (id) => {
    try {
      await deleteVaultEntry(user.userId, userKey, id);
      const entries = await getVaultEntries(user.userId, userKey);
      setVaultEntries(entries);
    } catch (err) {
      setError('Failed to delete entry.');
    }
  };

  const filteredEntries = vaultEntries.filter(
    (entry) =>
      entry.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !user || vaultInitialized === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Password Manager</h1>
      {!vaultInitialized ? (
        <div className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-black mb-4">Initialize Your Vault</h2>
          <p className="text-gray-600 text-sm mb-4">
            Create a secure vault to store your passwords. Download and save the private key file securely.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={handleInitializeVault}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Initialize Vault
          </button>
        </div>
      ) : !vaultUnlocked ? (
        <form onSubmit={handleUnlockVault} className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-black mb-4">Unlock Your Vault</h2>
          <p className="text-gray-600 text-sm mb-4">
            Upload your private key file to unlock your vault.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input
            type="file"
            accept=".bin"
            ref={fileInputRef}
            className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg mb-4"
            aria-label="Private key file"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Unlock
          </button>
        </form>
      ) : (
        <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
          {/* Password Generator */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-black mb-4">Generate Password</h2>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-sm font-medium text-black mb-2">Length: {length}</label>
              <input
                type="range"
                min="8"
                max="50"
                value={length}
                onChange={(e) => setLength(Number(e.target.value))}
                className="w-full"
                aria-label="Password length"
              />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={useUppercase}
                  onChange={(e) => setUseUppercase(e.target.checked)}
                  className="mr-2"
                />
                Uppercase (A-Z)
              </label>
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={useLowercase}
                  onChange={(e) => setUseLowercase(e.target.checked)}
                  className="mr-2"
                />
                Lowercase (a-z)
              </label>
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={useNumbers}
                  onChange={(e) => setUseNumbers(e.target.checked)}
                  className="mr-2"
                />
                Numbers (0-9)
              </label>
              <label className="flex items-center text-black">
                <input
                  type="checkbox"
                  checked={useSymbols}
                  onChange={(e) => setUseSymbols(e.target.checked)}
                  className="mr-2"
                />
                Symbols (!@#$%)
              </label>
            </div>
            <div className="mb-4">
              <div className="flex items-center">
                <input
                  type="text"
                  value={generatedPassword}
                  readOnly
                  className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none"
                  aria-label="Generated password"
                />
                <button
                  onClick={() => handleCopy(generatedPassword)}
                  className="ml-2 px-3 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
                  aria-label="Copy password"
                >
                  {copied === generatedPassword ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="mt-2 h-2 rounded-full overflow-hidden bg-gray-200">
                <div
                  className={`h-full ${strength.score === 0 ? 'bg-gray-200' : strength.score <= 2 ? 'bg-red-500' : strength.score === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${strength.score * 25}%` }}
                />
              </div>
              <p className="text-sm text-black mt-1">Strength: {strength.label}</p>
            </div>
            <button
              onClick={handleGenerate}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Generate
            </button>
          </div>

          {/* Save to Vault */}
          <form onSubmit={handleSaveToVault} className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-black mb-4">Save to Vault</h2>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder="Site Name (e.g., Gmail)"
              className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              aria-label="Site name"
            />
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or Email"
              className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              aria-label="Username"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              Save
            </button>
          </form>

          {/* Vault Dashboard */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-black mb-4">Password Vault</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by site name or username"
              className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              aria-label="Search vault"
            />
            <div className="space-y-4">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="text-black font-medium">{entry.siteName}</p>
                    <p className="text-gray-600 text-sm">{entry.username}</p>
                    <div className="flex items-center mt-1">
                      <input
                        type="text"
                        value={entry.password}
                        readOnly
                        className="text-sm text-black bg-transparent border-none"
                        aria-label={`Password for ${entry.siteName}`}
                      />
                      <button
                        onClick={() => handleCopy(entry.password)}
                        className="ml-2 text-blue-600 hover:underline text-sm"
                        aria-label={`Copy password for ${entry.siteName}`}
                      >
                        {copied === entry.password ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    aria-label={`Delete entry for ${entry.siteName}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {filteredEntries.length === 0 && (
                <p className="text-gray-600 text-center">No entries found.</p>
              )}
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        input[type="range"] {
          accent-color: #2563eb;
        }
      `}</style>
    </div>
  );
}