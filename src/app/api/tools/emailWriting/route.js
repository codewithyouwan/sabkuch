import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { getEmailPrompt } from './prompt';

export async function POST(request) {
  try {
    console.log('Received POST request to /api/tools/emailWriting');

    // Get request body
    const { context, tone, length } = await request.json();
    console.log('Request body:', { context, tone, length });

    // Validate inputs
    if (!context || typeof context !== 'string') {
      console.log('Validation error: Context is required');
      return new Response(JSON.stringify({ error: 'Context is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Initialize client
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.log('Configuration error: GitHub token not configured');
      return new Response(JSON.stringify({ error: 'GitHub token not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Initializing ModelClient with endpoint: https://models.github.ai/inference');
    const client = ModelClient(
      "https://models.github.ai/inference",
      new AzureKeyCredential(token)
    );

    // Construct prompt
    const prompt = getEmailPrompt(context, tone, length);
    console.log('Sending prompt to GPT-4.1 model:', prompt);

    // Call LLaMA 4 model
    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You are an assistant that generates professional emails." },
          { role: "user", content: prompt }
        ],
        temperature: 1,
        top_p: 1,
        model: "openai/gpt-4.1"
      }
    });

    // Handle response
    if (isUnexpected(response)) {
      console.error('Model API error:', response.body.error);
      return new Response(JSON.stringify({ error: response.body.error.message || 'Model API error' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse email content
    let emailText = response.body.choices[0].message.content || '{}';
    console.log('Model response:', emailText);

    // Extract JSON block if surrounded by text or backticks
    const jsonMatch = emailText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      emailText = jsonMatch[0];
      console.log('Extracted JSON:', emailText);
    }

    // Sanitize JSON: Escape unescaped newlines within string values
    emailText = emailText.replace(/(?<=: *"(?:[^"\\]|\\.)*)\n(?=(?:[^"\\]|\\.)*")/g, '\\n');
    console.log('Sanitized JSON:', emailText);

    let parsedEmail;
    try {
      parsedEmail = JSON.parse(emailText);
    } catch (err) {
      console.error('JSON parse error:', err.message, 'Response:', emailText);
      return new Response(JSON.stringify({ error: 'Invalid response format from model' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email structure
    if (!parsedEmail.subject || !parsedEmail.greeting || !parsedEmail.body || !parsedEmail.closing) {
      console.error('Incomplete email structure:', parsedEmail);
      return new Response(JSON.stringify({ error: 'Incomplete email structure from model' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Returning generated email:', parsedEmail);
    return new Response(JSON.stringify({ email: parsedEmail }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Server error:', err.message, err.stack);
    return new Response(JSON.stringify({ error: `Server error: ${err.message}` }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
}