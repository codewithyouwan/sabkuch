'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
      description: `Generate professional emails with customizable tone and length. Powered by GPT-4.1`,
      path: '/tools/email',
      icon: '📧',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-black text-2xl font-semibold">SabKuch</h1>
        <div className="relative" ref={dropdownRef}>
          <button
            className="text-blue-600 focus:outline-none"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="User menu"
          >
            <span className="text-2xl">👤</span>
          </button>
          <div
            className={`absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 ${
              isDropdownOpen ? 'block' : 'hidden'
            }`}
          >
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-black hover:bg-gray-100 rounded-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow p-6">
        <h2 className="text-3xl font-bold text-center text-black mb-8">Welcome, {user.name}!</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.path}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col items-center text-center"
            >
              <span className="text-4xl mb-4">{tool.icon}</span>
              <h3 className="text-xl font-semibold text-black mb-2">{tool.name}</h3>
              <p className="text-gray-600">{tool.description}</p>
            </Link>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 text-center text-black shadow-inner">
        <p>© 2025 SabKuch. All rights reserved.</p>
      </footer>
    </div>
  );
}