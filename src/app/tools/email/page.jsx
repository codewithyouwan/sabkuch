'use client';

import { useState, useRef, useEffect } from 'react';

export default function WritingTools() {
  const [context, setContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState(''); // New state for body length
  const [generatedEmail, setGeneratedEmail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef(null);

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [context]);

  const handleGenerateEmail = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate input
    if (context.trim().length === 0) {
      setError('Please enter the email context');
      setLoading(false);
      return;
    }

    try {
      console.log('Sending API request to /api/tools/emailWriting', { context, tone, length }); // Debug log
      const response = await fetch('/api/tools/emailWriting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, tone, length: length ? Number(length) : undefined }), // Send length as number or undefined
      });

      const data = await response.json();
      console.log('API response:', data); // Debug log
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate email');
      }

      setGeneratedEmail(data.email);
    } catch (err) {
      setError(err.message);
      console.error('API error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendViaEmail = () => {
    console.log('Send via Email button clicked'); // Debug log
    if (!generatedEmail) {
      console.log('No generated email available'); // Debug log
      setError('No email generated');
      return;
    }

    try {
      console.log('Preparing mailto link'); // Debug log
      const emailBody = `${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}`;
      const encodedSubject = encodeURIComponent(generatedEmail.subject);
      const encodedBody = encodeURIComponent(emailBody);
      const mailtoLink = `mailto:?subject=${encodedSubject}&body=${encodedBody}`;
      console.log('Mailto link:', mailtoLink); // Debug log

      const link = document.createElement('a');
      link.href = mailtoLink;
      link.style.display = 'none';
      document.body.appendChild(link);
      console.log('Triggering mailto link'); // Debug log
      link.click();
      document.body.removeChild(link);
      console.log('Mailto link triggered'); // Debug log
    } catch (err) {
      setError('Failed to open mail app. On macOS, go to System Settings > Desktop & Dock > Default Mail App and select Apple Mail or Outlook. Configure an email account. Alternatively, use Copy to Clipboard.');
      console.error('Mailto error:', err);
    }
  };

  const handleCopyToClipboard = () => {
    console.log('Copy to Clipboard button clicked'); // Debug log
    if (!generatedEmail) {
      console.log('No generated email available'); // Debug log
      setError('No email generated');
      return;
    }

    try {
      const emailText = `Subject: ${generatedEmail.subject}\n\n${generatedEmail.greeting}\n\n${generatedEmail.body}\n\n${generatedEmail.closing}`;
      navigator.clipboard.writeText(emailText)
        .then(() => {
          setError('Email copied to clipboard! Paste it into your mail app.');
          console.log('Email copied to clipboard'); // Debug log
        })
        .catch((err) => {
          setError('Failed to copy email. Please select and copy the text manually.');
          console.error('Clipboard error:', err);
        });
    } catch (err) {
      setError('Failed to copy email. Please select and copy the text manually.');
      console.error('Clipboard error:', err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-100">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Email Writing Tool</h1>
      <div className="flex-grow flex flex-col w-full max-w-3xl mx-auto">
        {generatedEmail && (
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-bold text-black mb-2">Generated Email</h2>
            <div className="space-y-2 text-black">
              <p><strong>Subject:</strong> {generatedEmail.subject}</p>
              <p><strong>Greeting:</strong> {generatedEmail.greeting}</p>
              <p><strong>Body:</strong><br />{generatedEmail.body.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}</p>
              <p><strong>Closing:</strong><br />{generatedEmail.closing.split('\n').map((line, i) => (
                <span key={i}>{line}<br /></span>
              ))}</p>
            </div>
            <button
              onClick={handleSendViaEmail}
              className="mt-4 w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Send via Email
            </button>
            <button
              onClick={handleCopyToClipboard}
              className="mt-2 w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Copy to Clipboard
            </button>
          </div>
        )}
        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}
        <form onSubmit={handleGenerateEmail} className="fixed bottom-4 left-0 right-0 flex justify-center">
          <div className="w-full max-w-3xl bg-white p-4 rounded-lg shadow-lg flex flex-col space-y-4">
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
              className="w-full p-4 text-black bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-base leading-relaxed scrollbar-hidden"
              disabled={loading}
              rows="1"
              style={{ minHeight: '40px', maxHeight: '12rem', boxSizing: 'border-box' }}
            />
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label htmlFor="tone" className="text-sm font-medium text-black">
                  Tone:
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="p-2 text-black border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="business">Business</option>
                  <option value="others">Others</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label htmlFor="length" className="text-sm font-medium text-black">
                  Body Length (chars):
                </label>
                <input
                  id="length"
                  type="number"
                  min="1"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  placeholder="Optional"
                  className="p-2 w-24 text-black border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
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
      `}</style>
    </div>
  );
}