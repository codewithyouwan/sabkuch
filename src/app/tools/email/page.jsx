'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
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
    setIsEditing(false); // Reset to static view

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
    <div className="min-h-screen flex flex-col p-4 bg-gray-100 pb-48">
      <CustomToaster />
      {loading && <Loader />}
      <button
        onClick={() => router.push('/home')}
        className="absolute top-4 left-4 text-gray-600 hover:text-gray-800 transition-colors focus:outline-none"
        aria-label="Go back to homepage"
      >
        <span className="text-2xl">←</span>
      </button>
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Email Writing Tool</h1>
      <div className="flex-grow flex flex-col w-full max-w-3xl mx-auto">
        {generatedEmail && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-black">Generated Email</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="py-1 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-4 text-black">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Subject:</label>
                  <input
                    type="text"
                    value={generatedEmail.subject}
                    onChange={(e) => handleEmailChange('subject', e.target.value)}
                    className="w-full p-2 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Greeting:</label>
                  <textarea
                    value={generatedEmail.greeting}
                    onChange={(e) => handleEmailChange('greeting', e.target.value)}
                    className="w-full p-2 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none email-textarea"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Body:</label>
                  <textarea
                    value={generatedEmail.body}
                    onChange={(e) => handleEmailChange('body', e.target.value)}
                    className="w-full p-2 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none email-textarea"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Closing:</label>
                  <textarea
                    value={generatedEmail.closing}
                    onChange={(e) => handleEmailChange('closing', e.target.value)}
                    className="w-full p-2 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none email-textarea"
                    rows={3}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2 text-black">
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
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send via Email
              </button>
              <button
                onClick={handleCopyToClipboard}
                className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy to Clipboard
              </button>
              <button
                onClick={handleSaveEmail}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Save Email
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleGenerateEmail} className="fixed bottom-4 left-0 right-0 flex justify-center">
          <div className="w-full max-w-3xl bg-white/20 backdrop-blur-sm p-4 rounded-lg shadow-lg flex flex-col space-y-4">
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
              className="w-full p-4 text-black bg-blue-50/70 border border-gray-200/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base leading-relaxed scrollbar-hidden"
              disabled={loading}
              rows={1}
              style={{ minHeight: '40px', maxHeight: '12rem', boxSizing: 'border-box' }}
            />
            <div className="flex items-center space-x-2">
              <label htmlFor="tone" className="text-sm font-medium text-black">
                Tone:
              </label>
              <select
                id="tone"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="p-2 text-black border border-gray-200/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/70"
                disabled={loading}
              >
                <option value="professional">Professional</option>
                <option value="friendly">Friendly</option>
                <option value="business">Business</option>
                <option value="others">Others</option>
              </select>
              <label htmlFor="length" className="text-sm font-medium text-black">
                Length:
              </label>
              <input
                id="length"
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                placeholder="e.g., 200"
                className="p-2 text-black border border-gray-200/60 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 w-24 bg-blue/70"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Generating...' : 'Generate'}
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