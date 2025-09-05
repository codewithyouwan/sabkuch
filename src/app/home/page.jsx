'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, LogOut, User, Mail, Lock, Sparkles, Shield } from 'lucide-react';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const router = useRouter();

  // Verify token and fetch user data
  useEffect(() => {
    const verifyToken = async () => {
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

        if (!response.ok) {
          localStorage.removeItem('authToken');
          setLoading(false);
          router.push('/login');
          return;
        }

        setUser({ userId: data.userId, email: data.email, name: data.name });
        setLoading(false);
      } catch (error) {
        console.error('Verification error:', error);
        localStorage.removeItem('authToken');
        setLoading(false);
        router.push('/login');
      }
    };

    verifyToken();
  }, [router]);

  // Handle clicks outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsDropdownOpen(false);
    router.push('/login');
  };

  // Tool data
  const tools = [
    {
      id: 'email-writer',
      name: 'Email Writer',
      description: 'Generate professional emails with customizable tone and length. Powered by GPT-4.1',
      path: '/tools/email',
      icon: (
        <div className="relative">
          <Mail className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-500/20',
      features: ['Professional tone', 'Custom length', 'Multiple templates'],
    },
    {
      id: 'password-manager',
      name: 'Password Manager',
      description: 'Securely generate and store passwords with client-side encryption.',
      path: '/tools/password',
      icon: (
        <div className="relative">
          <Lock className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-500/20',
      features: ['AES-GCM encryption', 'Secure vault', 'Auto-generation'],
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
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

  if (!user) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-40 w-36 h-36 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            SabKuch
          </h1>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            className="text-white hover:text-blue-300 focus:outline-none transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User menu"
          >
            <User className="w-6 h-6" />
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 bg-white/10 backdrop-blur-xl rounded-lg shadow-lg border border-white/20 z-10 ${
              isDropdownOpen ? 'block' : 'hidden'
            }`}
          >
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-white hover:bg-white/20 rounded-lg flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow p-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-white mb-8">
          Welcome, {user.name}!
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
            <Link
              key={tool.id}
              href={tool.path}
              className="relative bg-white/5 p-6 rounded-2xl border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all duration-300 transform hover:scale-105"
            >
              <div className={`w-16 h-16 ${tool.bgColor} rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden`}>
                {index === 0 && (
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                    <div className="absolute bottom-1 left-1 w-1 h-1 bg-white rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-white/30"></div>
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-2 left-2 w-3 h-3 border border-white rounded-sm"></div>
                    <div className="absolute bottom-2 right-2 w-2 h-2 border border-white rounded-full"></div>
                    <div className="absolute top-1/2 right-1 w-1 h-4 bg-white/30"></div>
                  </div>
                )}
                <div className="text-white z-10 relative">{tool.icon}</div>
                <div className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-80`}></div>
                <div className="absolute inset-0 bg-white/5"></div>
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{tool.name}</h3>
              <p className="text-gray-400 text-sm mb-3">{tool.description}</p>
              <div className="space-y-1">
                {tool.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <div className="w-1 h-1 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full"></div>
                    <span className="text-xs text-gray-500">{feature}</span>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/10 backdrop-blur-xl border-t border-white/20 p-4 text-center text-gray-300">
        <div className="flex items-center justify-center space-x-2 text-xs">
          <Shield className="w-4 h-4" />
          <span>© 2025 SabKuch. All rights reserved. • Enterprise-grade security</span>
        </div>
      </footer>
    </div>
  );
}