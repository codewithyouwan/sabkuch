import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return new Response(JSON.stringify({ error: 'Name, email, and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate password length
    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if email already exists
    const { data: existingUser, error: existingError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .single();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email already registered' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (existingError && existingError.code !== 'PGRST116') { // PGRST116: No rows found
      throw existingError;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const { data, error } = await supabase
      .from('users')
      .insert([{ name, email, password: hashedPassword }])
      .select('user_id')
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ message: 'Signup successful', userId: data.user_id }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Signup error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}