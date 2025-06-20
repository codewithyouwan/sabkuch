'use client';

import { useState, useEffect, useRef } from 'react';
import { generatePassword, calculateStrength, unlockVault, saveToVault, getVaultEntries, deleteVaultEntry, deriveKey, encryptData, decryptData } from './passwordUtils';

export default function PasswordManager() {
  const [length, setLength] = useState(16);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [strength, setStrength] = useState({ score: 0, label: '' });
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultEntries, setVaultEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const masterPasswordRef = useRef(null);

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

  // Focus master password input on load
  useEffect(() => {
    if (masterPasswordRef.current) {
      masterPasswordRef.current.focus();
    }
  }, []);

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

  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setError('');
    if (!masterPassword) {
      setError('Master password is required.');
      return;
    }
    try {
      const initialized = await unlockVault(masterPassword);
      if (initialized) {
        const entries = await getVaultEntries(masterPassword);
        setVaultEntries(entries);
        setVaultUnlocked(true);
        setMasterPassword('');
      }
    } catch (err) {
      setError(err.message || 'Failed to unlock vault. Try resetting the vault.');
    }
  };

  const handleResetVault = () => {
    if (confirm('Resetting the vault will delete all saved passwords. Are you sure?')) {
      localStorage.removeItem('passwordVault');
      setError('Vault reset. Enter a new master password to create a vault.');
      setMasterPassword('');
      setVaultUnlocked(false);
      setVaultEntries([]);
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
      await saveToVault(masterPassword, siteName, username, generatedPassword);
      const entries = await getVaultEntries(masterPassword);
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
      await deleteVaultEntry(masterPassword, id);
      const entries = await getVaultEntries(masterPassword);
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

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Password Manager</h1>
      {!vaultUnlocked ? (
        <form onSubmit={handleUnlockVault} className="w-full max-w-md mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold text-black mb-4">Unlock Your Vault</h2>
          <p className="text-gray-600 text-sm mb-4">
            Enter a strong master password to unlock or create your vault. Store it safely, as it cannot be recovered.
          </p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <input
            ref={masterPasswordRef}
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            placeholder="Enter master password"
            className="w-full p-3 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            aria-label="Master password"
          />
          <button
            type="submit"
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
          >
            Unlock
          </button>
          <button
            type="button"
            onClick={handleResetVault}
            className="w-full mt-2 py-2 px-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
          >
            Reset Vault
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