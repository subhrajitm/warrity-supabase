import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://avhubonvfquxgmontvaw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2aHVib252ZnF1eGdtb250dmF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzMzMTYsImV4cCI6MjA1ODI0OTMxNn0.bvPpp34JSBPhn8sakA2qBgYTyw5OZ8D_CFDxbIKfXDM';

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

export default supabase; 