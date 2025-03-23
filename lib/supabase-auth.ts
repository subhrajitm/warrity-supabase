import supabase from './supabase-config';

/**
 * Signs in a user with email and password
 * @param email User's email
 * @param password User's password
 * @returns The user session or error
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    // Save the token to localStorage for backward compatibility
    if (data.session?.access_token) {
      localStorage.setItem('authToken', data.session.access_token);
    }
    
    return { user: data.user, session: data.session };
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
}

/**
 * Signs up a new user with email and password
 * @param email User's email
 * @param password User's password
 * @param data Additional user data
 * @returns The user data or error
 */
export async function signUpWithEmail(
  email: string, 
  password: string,
  data?: Record<string, any>
) {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data,
      },
    });
    
    if (error) throw error;
    
    // Save the token to localStorage for backward compatibility
    if (authData.session?.access_token) {
      localStorage.setItem('authToken', authData.session.access_token);
    }
    
    // Create a profile for the new user
    if (authData.user?.id) {
      try {
        await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            email: email,
            name: data?.name || email.split('@')[0],
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]);
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
        // Don't throw here - user was created, but profile creation failed
        // The profile can be created later
      }
    }
    
    return { user: authData.user, session: authData.session };
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

/**
 * Signs out the current user
 */
export async function signOut() {
  try {
    // Remove token from localStorage
    localStorage.removeItem('authToken');
    
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Gets the current user session
 * @returns The current session or null
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    return data.session;
  } catch (error) {
    console.error('Error getting current session:', error);
    return null;
  }
}

/**
 * Gets the current user
 * @returns The current user or null
 */
export async function getCurrentUser() {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null; // Server-side, no user available
    }
    
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (error.message === 'Auth session missing!') {
        // This error occurs when there's no active session
        // It's a normal state, not an exception
        console.log('No auth session found');
        return null;
      }
      throw error;
    }
    
    return data.user;
  } catch (error) {
    // Only log as error if it's not the auth session missing error
    if (error instanceof Error && error.message !== 'Auth session missing!') {
      console.error('Error getting current user:', error);
    } else {
      console.log('Session not found, user not authenticated');
    }
    return null;
  }
}

/**
 * Resets a user's password
 * @param email User's email
 * @returns Success or error
 */
export async function resetPassword(email: string) {
  try {
    const appUrl = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://warrity.com';
      
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${appUrl}/reset-password`,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error resetting password:', error);
    throw error;
  }
}

/**
 * Updates a user's password
 * @param newPassword The new password
 * @returns Success or error
 */
export async function updatePassword(newPassword: string) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (error) throw error;
    
    return { success: true };
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
}

/**
 * Updates a user's profile
 * @param data The profile data to update
 * @returns The updated user or error
 */
export async function updateProfile(data: Record<string, any>) {
  try {
    // First update the auth user metadata
    const { data: user, error } = await supabase.auth.updateUser({
      data,
    });
    
    if (error) throw error;
    
    // Then update the profile in the profiles table
    if (user?.user?.id) {
      try {
        // Determine which fields to update in the profiles table
        const profileData: any = {};
        
        // Map auth data to profiles table
        if (data.name) profileData.name = data.name;
        if (data.avatar_url) profileData.profile_picture = data.avatar_url;
        if (data.bio) profileData.bio = data.bio;
        if (data.social_links) profileData.social_links = data.social_links;
        
        // Add updated_at timestamp
        profileData.updated_at = new Date().toISOString();
        
        // Only update if we have data to update
        if (Object.keys(profileData).length > 0) {
          const { error: profileError } = await supabase
            .from('profiles')
            .update(profileData)
            .eq('id', user.user.id);
          
          if (profileError) {
            console.error('Error updating profiles table:', profileError);
          }
        }
      } catch (profileError) {
        console.error('Error updating user profile:', profileError);
        // Don't throw here - auth was updated, but profile update failed
      }
    }
    
    return user;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
}

/**
 * Sets up auth state change listeners
 * @param callback Function to call when auth state changes
 * @returns The subscription that can be used to unsubscribe
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

/**
 * Sends an email verification link to the user
 * @param email User's email to verify
 * @returns Success or error
 */
export async function sendVerificationEmail(email: string) {
  try {
    const appUrl = typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_APP_URL || window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'https://warrity.com';
      
    // Send verification email with redirect URL
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${appUrl}/auth/callback`,
      },
    });
    
    if (error) throw error;
    
    return { success: true, message: 'Verification email sent successfully' };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to send verification email' 
    };
  }
}

/**
 * Verifies a user's email with a verification token
 * @param token The verification token from the email link
 * @returns Success or error
 */
export async function verifyEmail(token: string) {
  try {
    // The token is handled automatically by Supabase when the user clicks the verification link
    // This function can be used to check if a user is verified
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    // Check if the user's email is confirmed
    if (user.email_confirmed_at) {
      return { success: true, message: 'Email verified successfully' };
    } else {
      return { success: false, message: 'Email not verified yet' };
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to verify email' 
    };
  }
}

/**
 * Checks if the current user's email is verified
 * @returns Boolean indicating if email is verified
 */
export async function isEmailVerified() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    // User not found or email not confirmed
    if (!user || !user.email_confirmed_at) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
} 