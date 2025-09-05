'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { ArrowLeft, Mail, Sparkles, Copy, Save, Send, Layers } from 'lucide-react';
import Loader from '../../components/loader';
import CustomToaster from '../../components/toast';

export default function WritingTools() {
  const [context, setContext] = useState('');
  const [user, setUser] = useState(null);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const textareaRef = useRef(null);
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
        if (!response.ok || data.message !== 'Token is valid') {
          toast.error(data.error || 'Invalid token');
          localStorage.removeItem('authToken');
          setLoading(false);
          router.push('/login');
          return;
        }
        setUser({ userId: data.userId, email: data.email, name: data.name });
        console.log('User verified:', data);
        setLoading(false);
      } catch (error) {
        console.error('Verification error:', error);
        toast.error('Network error during verification');
        localStorage.removeItem('authToken');
        setLoading(false);
        router.push('/login');
      }
    };

    verifyToken();
  }, [router]);

  // Auto-resize context textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [context]);

  // Auto-resize email textareas when editing
  useEffect(() => {
    if (isEditing) {
      const textareas = document.querySelectorAll('.email-textarea');
      textareas.forEach((ta) => {
        ta.style.height = 'auto';
        ta.style.height = `${ta.scrollHeight}px`;
      });
    }
  }, [isEditing, generatedEmail]);

  const handleGenerateEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setIsEditing(false);

    if (context.trim().length === 0) {
      toast.error('Please enter the email context');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending API request with:', { context, tone, length });
      const response = await fetch('/api/tools/emailWriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, tone, length }),
      });

      const data = await response.json();
      console.log('API response:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }
      setGeneratedEmail({ ...data.email, prompt: context });
    } catch (err) {
      toast.error(err.message);
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (field, value) => {
    setGeneratedEmail((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendViaEmail = () => {
    console.log('Send via Email button clicked');
    if (!generatedEmail) {
      console.log('No generated email available');
      toast.error('No email generated');
      return;
    }

    try {
      console.log('Preparing mailto link');
      const emailBody = `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}`;
      const encodedSubject = encodeURIComponent(generatedEmail.subject);
      const encodedBody = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      console.log('Mailto link:', mailtoLink);

      const link = document.createElement('a');
      link.href = mailtoLink;
      link.style.display = 'none';
      document.body.appendChild(link);
      console.log('Triggering mailto link');
      link.click();
      document.body.removeChild(link);
      console.log('Mailto link triggered');
      toast.success('Email opened in your mail app');
    } catch (err) {
      toast.error('Failed to open mail app. Use Copy to Clipboard as a fallback.');
      console.error('Mailto error:', err);
    }
  };

  const handleCopyToClipboard = () => {
    console.log('Copy to Clipboard button clicked');
    if (!generatedEmail) {
      console.log('No generated email available');
      toast.error('No email generated');
      return;
    }

    try {
      const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}`;
      navigator.clipboard.writeText(emailText)
        .then(() => {
          toast.success('Email copied to clipboard! Paste it into your mail app.');
          console.log('Email copied to clipboard');
        })
        .catch((err) => {
          toast.error('Failed to copy email. Please select and copy the text manually.');
          console.error('Clipboard error:', err);
        });
    } catch (err) {
      toast.error('Failed to copy email. Please select and copy the text manually.');
      console.error('Clipboard error:', err);
    }
  };

  const handleSaveEmail = async (retries = 3) => {
    console.log('Save Email button clicked');
    if (!generatedEmail) {
      console.log('No generated email available');
      toast.error('No email generated');
      return;
    }

    setLoading(true);
    try {
      console.log('Saving email with:', { ...generatedEmail, user_id: user.userId, name: user.name });
      const response = await fetch('/api/tools/saveMail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.userId,
          subject: generatedEmail.subject,
          body: generatedEmail.body,
          greetings: generatedEmail.greeting,
          closing: generatedEmail.closing,
          prompt: generatedEmail.prompt,
        }),
      });

      const data = await response.json();
      console.log('Save email response:', data);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save email');
      }

      toast.success('Email saved successfully!');
    } catch (err) {
      if (retries > 1 && err.message.includes('fetch failed')) {
        console.log('Retrying save email, retries left:', retries - 1);
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return handleSaveEmail(retries - 1);
      }
      toast.error(err.message);
      console.error('Save email error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col p-4 pb-48">
      <CustomToaster />
      {loading && <Loader />}
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
            Email Writing Tool
          </h1>
        </div>
        <div className="w-6 h-6" /> {/* Placeholder for symmetry */}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-grow flex flex-col w-full max-w-3xl mx-auto">
        {generatedEmail && (
          <div className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl shadow-2xl border border-white/20 mb-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Generated Email</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors text-sm"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4 text-white">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Subject:</label>
                  <input
                    type="text"
                    value={generatedEmail.subject}
                    onChange={(e) => handleEmailChange('subject', e.target.value)}
                    className="w-full p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Greeting:</label>
                  <textarea
                    value={generatedEmail.greeting}
                    onChange={(e) => handleEmailChange('greeting', e.target.value)}
                    className="w-full p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none email-textarea transition-all duration-200"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Body:</label>
                  <textarea
                    value={generatedEmail.body}
                    onChange={(e) => handleEmailChange('body', e.target.value)}
                    className="w-full p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none email-textarea transition-all duration-200"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-1">Closing:</label>
                  <textarea
                    value={generatedEmail.closing}
                    onChange={(e) => handleEmailChange('closing', e.target.value)}
                    className="w-full p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none email-textarea transition-all duration-200"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-gray-200">
                <p><strong>Subject:</strong> {generatedEmail.subject}</p>
                <p><strong>Greeting:</strong> {generatedEmail.greeting}</p>
                <p>
                  <strong>Body:</strong>
                  <br />
                  {generatedEmail.body.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
                <p>
                  <strong>Closing:</strong>
                  <br />
                  {generatedEmail.closing.split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      <br />
                    </span>
                  ))}
                </p>
              </div>
            )}
            <div className="flex flex-col space-y-2 mt-6">
              <button
                onClick={handleSendViaEmail}
                className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send via Email</span>
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="w-full py-2 px-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span>Copy to Clipboard</span>
              </button>
              <button
                onClick={handleSaveEmail}
                className="w-full py-2 px-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Email</span>
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleGenerateEmail} className="fixed bottom-4 left-0 right-0 flex justify-center">
          <div className="w-full max-w-3xl bg-white/10 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/20 flex flex-col space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                ref={textareaRef}
                value={context}
                onChange={(e) => {
                  setContext(e.target.value);
                  const textarea = textareaRef.current;
                  textarea.style.height = 'auto';
                  textarea.style.height = `${textarea.scrollHeight}px`;
                }}
                placeholder="e.g., Write a professional email to my manager requesting leave"
                className="w-full pl-11 pr-4 py-3 text-white bg-white/10 border border-white/20 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none text-base leading-relaxed scrollbar-hidden"
                disabled={loading}
                rows={1}
                style={{ minHeight: '40px', maxHeight: '12rem', boxSizing: 'border-box' }}
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="tone" className="text-sm font-medium text-gray-200">
                  Tone:
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="business">Business</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="length" className="text-sm font-medium text-gray-200">
                  Length:
                </label>
                <input
                  id="length"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="e.g., 200"
                  className="p-2 text-white bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-24"
                  disabled={loading}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-200 transform hover:scale-105 ${loading ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Generating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Generate Email</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
      <style jsx>{`
        .scrollbar-hidden {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Edge */
        }
        .email-textarea {
          min-height: 40px;
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}