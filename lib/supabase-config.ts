import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avhubonvfquxgmontvaw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aHVib252ZnF1eGdtb250dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzMzMTYsImV4cCI6MjA1ODI0OTMxNn0.bvPpp34JSBPhn8sakA2qBgYTyw5OZ8D_CFDxbIKfXDM';

if (!supabaseUrl) {
  console.warn('Supabase URL is not set, using default value');
}

if (!supabaseAnonKey) {
  console.warn('Supabase anon key is not set, using default value');
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser, // Only persist session in browser
    autoRefreshToken: true, 
    flowType: 'pkce',
    detectSessionInUrl: isBrowser, // Only detect in browser
    // Only set redirect in browser environment
    ...(isBrowser ? { 
      redirect_to: window.location.origin 
    } : {})
  }
});

export default supabase; 