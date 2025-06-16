export const getEmailPrompt = (context, tone) => {
  const tonePrompt = tone === 'others' ? '' : `Tone: ${tone.charAt(0).toUpperCase() + tone.slice(1)}`;
  return `
    You are an assistant that generates professional emails. Based on the context: "${context}" and ${tonePrompt}, return ONLY a JSON object in this exact format:
    {
      "subject": "Email Subject",
      "greeting": "Dear [Recipient],",
      "body": "Email body content.",
      "closing": "Best regards,\\n[Your Name]"
    }
    Do NOT include any additional text, explanations, markdown backticks, or comments before or after the JSON. Ensure the JSON is valid, with all control characters (e.g., newlines) properly escaped (e.g., use \\n for newlines). The email must be well-formatted, professional, and match the specified tone (or an appropriate tone if none is specified). Replace [Your Name] with the sender's name from the context (e.g., "Devesh Kumar" if provided), otherwise use a generic placeholder like "Sender".
  `;
};