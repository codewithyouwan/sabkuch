'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

//   // Load email from localStorage on mount
//   useEffect(() => {
//     const savedEmail = localStorage.getItem('loginEmail');
//     if (savedEmail) {
//       setEmail(savedEmail);
//     }
//   }, []);

  // Validate form inputs
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Client-side validation
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Save email to localStorage
    //   localStorage.setItem('loginEmail', email);

      // Redirect to login page after successful signup
      setTimeout(() => {
        setLoading(false);
        alert('Signup successful! Please log in.'); // Replace with actual signup logic
        router.push('/login');
      }, 1000); // Simulate network delay
    } catch (error) {
      setError('Network error, please try again');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-black">Sign Up for SabKuch</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-black">
              Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full p-2 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-600"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}