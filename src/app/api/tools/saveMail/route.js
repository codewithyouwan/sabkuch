import { createClient } from "@supabase/supabase-js";
export async function POST(request) {
  try {
    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
          console.log('Configuration error: Supabase credentials not configured');
          alert("Supabase credentials are not configured. Please check your environment variables.");
    }
    const supa = createClient(supabaseUrl, supabaseKey);
    console.log('Initialized Supabase client');
    console.log('Received POST request to /api/tools/saveMail');

    // Get request body
    const { user_id, subject, body, recipient_email, closing, prompt } = await request.json();
    console.log('Request body:', { user_id, subject, body, recipient_email, closing, prompt });

    // Validate inputs
    if (!user_id || !subject || !body || !closing || !prompt) {
      console.log('Validation error: Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Verify user exists
    const { data: user, error: userError } = await supa
      .from('users')
      .select('user_id')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      console.log('User error:', userError || 'User not found');
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save email
    const { data, error } = await supa
      .from('emails')
      .insert([
        {
          user_id,
          subject,
          body,
          recipient_email,
          closing,
          prompt,
        },
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Email saved:', data[0]);
    return new Response(JSON.stringify({ message: 'Email saved successfully', email: data[0] }), {
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