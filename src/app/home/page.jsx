'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

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

        setUser({ userId: data.userId, email: data.email });
        setLoading(false);
        alert('Token is valid');
      } catch (error) {
        console.error('Verification error:', error);
        localStorage.removeItem('authToken');
        setLoading(false);
        router.push('/login');
      }
    };

    verifyToken();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to login
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Welcome to SabKuch</h1>
        <p className="text-center text-black">Hello, {user.email}!</p>
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            router.push('/login');
          }}
          className="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700 transition-colors mt-4"
        >
          Logout
        </button>
      </div>
    </div>
  );
}