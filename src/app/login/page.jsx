'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { Eye, EyeOff, Lock, Mail, Shield, ChevronRight, Zap, FileText, Key, Bot, Sparkles, Layers, Grid3x3, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeToolIndex, setActiveToolIndex] = useState(0);
  
  // Note: In your actual implementation, you'll need to import useRouter from 'next/navigation'
  const router = useRouter();

  const tools = [
    {
      name: "AI Email Writer",
      description: "Generate professional emails with GPT-4.1",
      icon: (
        <div className="relative">
          <Mail className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-500/20",
      features: ["Professional tone", "Custom length", "Multiple templates"]
    },
    {
      name: "Password Manager",
      description: "Secure password generation & storage",
      icon: (
        <div className="relative">
          <Key className="w-8 h-8" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
            <Shield className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-500/20",
      features: ["AES-GCM encryption", "Secure vault", "Auto-generation"]
    },
    {
      name: "Smart Assistant",
      description: "AI-powered productivity companion",
      icon: (
        <div className="relative">
          <Bot className="w-8 h-8" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full flex items-center justify-center">
            <Zap className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-500/20",
      features: ["Task automation", "Smart suggestions", "Context aware"]
    },
    {
      name: "Document Tools",
      description: "Advanced document processing",
      icon: (
        <div className="relative">
          <FileText className="w-8 h-8" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full flex items-center justify-center">
            <Grid3x3 className="w-2 h-2 text-white" />
          </div>
        </div>
      ),
      color: "from-orange-500 to-red-500",
      bgColor: "bg-orange-500/20",
      features: ["Format conversion", "Text analysis", "Auto-summary"]
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveToolIndex((prev) => (prev + 1) % tools.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Client-side validation
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      // Save token to localStorage (Note: In real implementation, this would work)
      if (typeof window !== 'undefined') {
        localStorage.setItem('authToken', data.token);
        console.log('Auth token saved:', data.token);
      }

      // Redirect to homepage after successful login
      setTimeout(() => {
        setLoading(false);
        router.push('/home'); // Uncomment in actual implementation
        console.log('Redirecting to /home...');
      }, 1000);

    } catch (error) {
      setError('Network error, please try again');
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(e);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute top-40 right-40 w-24 h-24 bg-green-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute bottom-40 left-40 w-36 h-36 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-7xl flex items-center justify-center">
        {/* Left side - Tools Showcase */}
        <div className="hidden lg:flex lg:w-3/5 flex-col justify-center p-12">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Layers className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-5xl font-bold text-white">
                <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  SabKuch
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-300 mb-4">
              Your complete productivity toolkit
            </p>
            <p className="text-gray-400">
              Powerful tools designed to boost your efficiency and streamline your workflow
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {tools.map((tool, index) => (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border border-white/10 transition-all duration-500 cursor-pointer ${
                  activeToolIndex === index 
                    ? 'bg-white/15 border-white/30 scale-105 shadow-2xl' 
                    : 'bg-white/5 hover:bg-white/10'
                }`}
                onClick={() => setActiveToolIndex(index)}
              >
                <div className={`w-16 h-16 ${tool.bgColor} rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden`}>
                  {/* Background pattern based on tool type */}
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
                  {index === 2 && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-1 left-1 w-px h-3 bg-white"></div>
                      <div className="absolute top-1 left-1 w-3 h-px bg-white"></div>
                      <div className="absolute bottom-1 right-1 w-2 h-2 bg-white rounded-full"></div>
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                    </div>
                  )}
                  {index === 3 && (
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-2 left-2 right-2 h-px bg-white"></div>
                      <div className="absolute top-4 left-2 right-2 h-px bg-white/60"></div>
                      <div className="absolute bottom-2 right-2 w-2 h-2 bg-white/80"></div>
                    </div>
                  )}
                  
                  <div className={`text-white z-10 relative`}>
                    {tool.icon}
                  </div>
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
                {activeToolIndex === index && (
                  <div className="absolute top-4 right-4">
                    <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">4+</div>
              <div className="text-sm text-gray-400">Productivity Tools</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">Bank</div>
              <div className="text-sm text-gray-400">Grade Security</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">AI</div>
              <div className="text-sm text-gray-400">Powered</div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="w-full lg:w-2/5 max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/20">
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                  SabKuch
                </h1>
              </div>
              <p className="text-gray-300">Your productivity toolkit awaits</p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
              <p className="text-gray-300">Access your productivity tools</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Accessing Tools...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <span>Access My Tools</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-gray-300">
                New to SabKuch?{' '}
                <a href="/signup" className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors">
                  Get your toolkit
                </a>
              </p>
            </div>

            {/* Mobile tools preview */}
            <div className="lg:hidden mt-8 grid grid-cols-2 gap-3">
              {tools.slice(0, 2).map((tool, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-3 border border-white/10">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 relative overflow-hidden`}>
                    <div className={`text-white z-10 relative`}>
                      {React.cloneElement(tool.icon, { className: "w-4 h-4" })}
                    </div>
                    <div className={`absolute inset-0 bg-gradient-to-r ${tool.color} opacity-80`}></div>
                    <div className="absolute inset-0 bg-white/10"></div>
                  </div>
                  <h4 className="text-white text-sm font-semibold">{tool.name}</h4>
                  <p className="text-gray-400 text-xs">{tool.description}</p>
                </div>
              ))}
            </div>

            {/* Security badge */}
            <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Enterprise-grade security • End-to-end encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}