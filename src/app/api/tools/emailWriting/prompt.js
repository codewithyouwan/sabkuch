export const getEmailPrompt = (context, tone, length) => {
  const tonePrompt = tone && tone !== 'others' ? `Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}` : '';
  const lengthPrompt = length ? `The body of the email should be approximately ${length} characters in length.` : '';
  const prompts = [tonePrompt, lengthPrompt].filter(Boolean).join(', ');
  return `
    You are an assistant that generates emails. Based on the context: "${context}"${prompts ? `, ${prompts}` : ''} return ONLY a valid JSON object in this exact format:
    {
      "subject": "Email Subject",
      "greeting": "Dear [Recipient],",
      "body": "Email body content.",
      "closing": "Best regards,\\n[Your Name]"
    }
    Ensure the JSON is valid, with all control characters (e.g., newlines) escaped (e.g., use \\n for newlines). Do NOT include markdown backticks, additional text, explanations, or comments. The email must be professional, well-formatted, and match the specified tone or a neutral professional tone if none specified. Replace [Your Name] with the sender's name from the context if provided, otherwise use "Sender". If a body length is specified, ensure the body is approximately that length while maintaining clarity and coherence.
  `;
};