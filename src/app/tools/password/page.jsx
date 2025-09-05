'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';
import { generatePassword, calculateStrength, initializeVault, unlockVault, saveToVault, getVaultEntries, deleteVaultEntry, generateUserKey, exportUserKey, importUserKey } from '../../utils/passwordUtils';
import { ArrowLeft, Lock, Copy, Save, Upload, Shield, Search, Trash, Layers } from 'lucide-react';

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-40 right-40 w-24 h-24 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-40 left-40 w-36 h-36 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>
        <p className="text-white text-lg font-semibold">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-40 w-36 h-36 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <button
          onClick={() => router.push('/home')}
          className="text-gray-300 hover:text-blue-300 transition-colors focus:outline-none"
          aria-label="Go back to homepage"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Password Manager
          </h1>
        </div>
        <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-6">
        {!vaultInitialized ? (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Initialize Your Vault</h2>
            <p className="text-gray-300 text-sm mb-4">
              Create a secure vault to store your passwords. Download and save the private key file securely.
            </p>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <button
              onClick={handleInitializeVault}
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Initialize Vault</span>
            </button>
          </div>
        ) : !vaultUnlocked ? (
          <form onSubmit={handleUnlockVault} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4">Unlock Your Vault</h2>
            <p className="text-gray-300 text-sm mb-4">
              Upload your private key file to unlock your vault.
            </p>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
            <div className="relative mb-4">
              <input
                type="file"
                accept=".bin"
                ref={fileInputRef}
                className="w-full p-3 text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                aria-label="Private key file"
              />
              <Upload className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock</span>
            </button>
          </form>
        ) : (
          <>
            {/* Password Generator */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Generate Password</h2>
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-200 mb-2">Length: {length}</label>
                <input
                  type="range"
                  min="8"
                  max="50"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full"
                  aria-label="Password length"
                  style={{ accentColor: '#3b82f6' }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <label className="flex items-center text-gray-200">
                  <input
                    type="checkbox"
                    checked={useUppercase}
                    onChange={(e) => setUseUppercase(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  Uppercase (A-Z)
                </label>
                <label className="flex items-center text-gray-200">
                  <input
                    type="checkbox"
                    checked={useLowercase}
                    onChange={(e) => setUseLowercase(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  Lowercase (a-z)
                </label>
                <label className="flex items-center text-gray-200">
                  <input
                    type="checkbox"
                    checked={useNumbers}
                    onChange={(e) => setUseNumbers(e.target.checked)}
                    className="mr-2 accent-blue-500"
                  />
                  Numbers (0-9)
                </label>
                <label className="flex items-center text-gray-200">
                  <input
                    type="checkbox"
                    checked={useSymbols}
                    onChange={(e) => setUseSymbols(e.target.checked)}
                    className="mr-2 accent-blue-500"
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
                    className="w-full p-3 text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    aria-label="Generated password"
                  />
                  <button
                    onClick={() => handleCopy(generatedPassword)}
                    className="ml-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                    aria-label="Copy password"
                  >
                    {copied === generatedPassword ? 'Copied!' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 h-2 rounded-full overflow-hidden bg-gray-600">
                  <div
                    className={`h-full ${strength.score === 0 ? 'bg-gray-600' : strength.score <= 2 ? 'bg-red-500' : strength.score === 3 ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${strength.score * 25}%` }}
                  />
                </div>
                <p className="text-sm text-gray-300 mt-1">Strength: {strength.label}</p>
              </div>
              <button
                onClick={handleGenerate}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Generate</span>
              </button>
            </div>

            {/* Save to Vault */}
            <form onSubmit={handleSaveToVault} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Save to Vault</h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Site Name (e.g., Gmail)"
                  className="w-full p-3 pl-10 text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Site name"
                />
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or Email"
                  className="w-full p-3 pl-10 text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Username"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
            </form>

            {/* Vault Dashboard */}
            <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Password Vault</h2>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by site name or username"
                  className="w-full p-3 pl-10 text-white bg-white/10 border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  aria-label="Search vault"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {filteredEntries.map((entry) => (
                  <div key={entry.id} className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-white font-medium">{entry.siteName}</p>
                      <p className="text-gray-400 text-sm">{entry.username}</p>
                      <div className="flex items-center mt-1">
                        <input
                          type="text"
                          value={entry.password}
                          readOnly
                          className="text-sm text-white bg-transparent border-none"
                          aria-label={`Password for ${entry.siteName}`}
                        />
                        <button
                          onClick={() => handleCopy(entry.password)}
                          className="ml-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                          aria-label={`Copy password for ${entry.siteName}`}
                        >
                          {copied === entry.password ? 'Copied!' : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteEntry(entry.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                      aria-label={`Delete entry for ${entry.siteName}`}
                    >
                      <Trash className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                {filteredEntries.length === 0 && (
                  <p className="text-gray-400 text-center">No entries found.</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}