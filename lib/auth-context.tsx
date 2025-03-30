"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signOut, 
  getCurrentUser, 
  updatePassword as updateUserPassword,
  onAuthStateChange,
} from './supabase-auth';
import { 
  getCurrentProfile, 
  updateProfile as updateUserProfile, 
  getProfileById, 
  createProfile,
  type Profile 
} from './services/profile-service';
import supabase from './supabase-config';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isVerified?: boolean;
  [key: string]: any;
}

interface ProfileUpdateData {
  name?: string;
  phone?: string;
  bio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  preferences?: {
    emailNotifications?: boolean;
    reminderDays?: number;
    theme?: string;
    notifications?: boolean;
    language?: string;
  };
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, shouldRedirect: boolean) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<boolean>;
  updateProfile: (profileData: ProfileUpdateData) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Validation utilities
function validateProfileData(data: ProfileUpdateData): { isValid: boolean; error?: string } {
  // Validate name
  if (data.name && (data.name.length < 2 || data.name.length > 50)) {
    return {
      isValid: false,
      error: 'Name must be between 2 and 50 characters'
    };
  }

  // Validate phone
  if (data.phone) {
    const phoneRegex = /^\+?[\d\s-()]{8,}$/;
    if (!phoneRegex.test(data.phone)) {
      return {
        isValid: false,
        error: 'Invalid phone number format'
      };
    }
  }

  // Validate bio
  if (data.bio && data.bio.length > 500) {
    return {
      isValid: false,
      error: 'Bio must not exceed 500 characters'
    };
  }

  // Validate social links
  if (data.socialLinks) {
    const urlRegex = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
    for (const [platform, url] of Object.entries(data.socialLinks)) {
      if (url && !urlRegex.test(url)) {
        return {
          isValid: false,
          error: `Invalid ${platform} URL. Please enter a valid URL starting with http:// or https://`
        };
      }
    }
  }

  // Validate preferences
  if (data.preferences) {
    if (typeof data.preferences.emailNotifications !== 'undefined' && 
        typeof data.preferences.emailNotifications !== 'boolean') {
      return {
        isValid: false,
        error: 'Email notifications must be a boolean value'
      };
    }

    if (typeof data.preferences.reminderDays !== 'undefined') {
      const days = Number(data.preferences.reminderDays);
      if (isNaN(days) || days < 1 || days > 365) {
        return {
          isValid: false,
          error: 'Reminder days must be between 1 and 365'
        };
      }
    }
  }

  return { isValid: true };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch the current user's profile
  const fetchUserProfile = async () => {
    try {
      // First, get the current user from Supabase Auth
      const currentUser = await getCurrentUser();
      
      // If no user, clear the state
      if (!currentUser) {
        setIsLoading(false);
        setIsAuthenticated(false);
        setError(null);
        setUser(null);
        return;
      }
      
      // Check if email is verified
      const isEmailVerified = !!currentUser.email_confirmed_at;
      
      // If email is not verified, set verification status
      if (!isEmailVerified) {
        const userWithVerification: User = {
          ...currentUser,
          id: currentUser.id,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          role: 'user',
          isVerified: false
        };
        
        setUser(userWithVerification);
        setIsLoading(false);
        setIsAuthenticated(true);
        setError("Please verify your email address to access all features.");
        return;
      }
      
      // Get user profile from profile service
      const profile = await getCurrentProfile();
      
      // If profile exists, merge auth user and profile data
      if (profile) {
        const userWithProfile: User = {
          ...currentUser,
          ...profile,
          id: currentUser.id,
          name: profile.name || currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
          email: profile.email || currentUser.email || '',
          role: profile.role || 'user',
          isVerified: true
        };
        
        setUser(userWithProfile);
        setProfile(profile);
        setIsLoading(false);
        setIsAuthenticated(true);
        setError(null);
      } else {
        // No profile found, just use the auth user data
        const userWithoutProfile: User = {
          ...currentUser,
          id: currentUser.id,
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'User',
          email: currentUser.email || '',
          role: 'user',
          isVerified: true
        };
        
        setUser(userWithoutProfile);
        setIsLoading(false);
        setIsAuthenticated(true);
        setError(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setIsLoading(false);
      setIsAuthenticated(false);
      setError('Failed to load user profile');
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Don't attempt to get auth user on the server
        if (typeof window === 'undefined') {
          setIsLoading(false);
          return;
        }
        
        // Check localStorage first for backwards compatibility
        const hasLocalToken = !!localStorage.getItem('authToken');
        
        // Get user from Supabase auth
        let authUser;
        try {
          authUser = await getCurrentUser();
        } catch (authError) {
          console.warn('Auth check error:', authError);
          // Continue to avoid breaking the app
        }
        
        if (authUser) {
          // Get profile from Supabase profiles table
          let userProfile;
          try {
            userProfile = await getCurrentProfile();
          } catch (profileError) {
            console.error('Error getting profile during auth check:', profileError);
            // Continue without the profile for now
          }
          
          // If user exists but profile doesn't, create it
          if (authUser && !userProfile && authUser.email) {
            let newProfile;
            try {
              newProfile = await createProfile({
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                role: 'user'
              });
            } catch (profileError) {
              console.error('Error creating profile:', profileError);
              // Handle profile creation error gracefully
              newProfile = {
                id: authUser.id,
                email: authUser.email,
                name: authUser.user_metadata?.name || authUser.email.split('@')[0],
                role: 'user'
              };
            }
            
            if (newProfile) {
              setProfile(newProfile);
            }
          } else if (userProfile) {
            setProfile(userProfile);
          }
          
          // Map user data to our User interface
          setUser({
            id: authUser.id,
            email: authUser.email || '',
            name: userProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
            role: userProfile?.role || 'user',
            // Add additional user fields if needed
          });
          
          setIsAuthenticated(true);
        } else if (hasLocalToken) {
          // Legacy token exists but no Supabase session
          // Attempt to refresh the session
          try {
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              // Session refreshed, try again
              fetchUserProfile();
            } else {
              // No valid session, clear token
              localStorage.removeItem('authToken');
              setUser(null);
              setProfile(null);
            }
          } catch (refreshError) {
            console.error('Session refresh failed:', refreshError);
            localStorage.removeItem('authToken');
            setUser(null);
            setProfile(null);
          }
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Set up auth state change listener
    let authListener: any = null;
    try {
      const listener = onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
          // Refresh the user data when auth state changes
          fetchUserProfile();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      });
      
      authListener = listener;
    } catch (error) {
      console.error('Auth listener setup failed:', error);
    }
    
    // Clean up the subscription
    return () => {
      if (authListener?.subscription?.unsubscribe) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string, shouldRedirect: boolean = true): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { user: authUser, session } = await signInWithEmail(email, password);
      
      if (!authUser || !session) {
        toast.error('Login failed');
        return false;
      }
      
      // Get user profile from Supabase profiles table
      let userProfile;
      try {
        userProfile = await getProfileById(authUser.id);
      } catch (profileError) {
        console.error('Error getting profile during login:', profileError);
        // Continue without profile
      }
      
      // Create profile if it doesn't exist
      if (!userProfile && authUser.email) {
        try {
          const newProfile = await createProfile({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || email.split('@')[0],
            role: 'user'
          });
          
          if (newProfile) {
            setProfile(newProfile);
          }
        } catch (profileError) {
          console.error('Error creating profile during login:', profileError);
          // Continue with a minimal profile
          setProfile({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || email.split('@')[0],
            role: 'user'
          });
        }
      } else if (userProfile) {
        setProfile(userProfile);
      }
      
      // Map user data to our User interface
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: userProfile?.name || authUser.user_metadata?.name || email.split('@')[0] || 'User',
        role: userProfile?.role || 'user',
      });
      
      setIsAuthenticated(true);
      toast.success('Login successful');
      
      // Only redirect if shouldRedirect is true
      if (shouldRedirect) {
        const redirectPath = (userProfile?.role === 'admin' || authUser.app_metadata?.role === 'admin') 
          ? '/admin' 
          : '/user';
        router.push(redirectPath);
      }
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut();
      
      // Clear local state
      setUser(null);
      setProfile(null);
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      toast.error('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Use Supabase Auth to create the user
      const { user: authUser, session } = await signUpWithEmail(
        userData.email, 
        userData.password,
        {
          name: userData.name,
          phone: userData.phone
        }
      );
      
      if (!authUser) {
        toast.error('Registration failed');
        return false;
      }
      
      // Note: Profile creation is handled in signUpWithEmail
      // Get the created profile
      const userProfile = await getProfileById(authUser.id);
      setProfile(userProfile);
      
      // Map user data to our User interface
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        name: userProfile?.name || userData.name || authUser.email?.split('@')[0] || 'User',
        role: userProfile?.role || 'user',
      });
      
      toast.success('Registration successful');
      
      // Redirect to confirmation page
      router.push('/confirm-email');
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      // Validate profile data
      const validation = validateProfileData(profileData);
      if (!validation.isValid) {
        toast.error(validation.error || 'Invalid profile data');
        return false;
      }
      
      if (!user) {
        toast.error('You must be logged in to update your profile');
        return false;
      }
      
      // Format social links for Supabase
      const social_links = profileData.socialLinks ? {
        twitter: profileData.socialLinks.twitter || '',
        linkedin: profileData.socialLinks.linkedin || '',
        github: profileData.socialLinks.github || '',
        instagram: profileData.socialLinks.instagram || '',
      } : undefined;
      
      // Update profile in Supabase profiles table
      const updatedProfile = await updateUserProfile({
        id: user.id,
        name: profileData.name,
        bio: profileData.bio,
        social_links,
        updated_at: new Date().toISOString()
      });
      
      if (!updatedProfile) {
        toast.error('Failed to update profile');
        return false;
      }
      
      // Also update user metadata in Supabase Auth
      await supabase.auth.updateUser({
        data: {
          name: profileData.name,
          bio: profileData.bio,
          socialLinks: profileData.socialLinks,
          preferences: profileData.preferences,
        }
      });
      
      // Update local state
      setProfile(updatedProfile);
      setUser({
        ...user,
        name: updatedProfile.name || user.name,
        bio: updatedProfile.bio,
      });
      
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      // Get user from Supabase auth
      const authUser = await getCurrentUser();
      
      if (authUser) {
        // Get profile from Supabase profiles table
        const userProfile = await getCurrentProfile();
        
        // If profile doesn't exist, create it
        if (!userProfile && authUser.email) {
          const newProfile = await createProfile({
            id: authUser.id,
            email: authUser.email,
            name: authUser.user_metadata?.name || authUser.email.split('@')[0],
            role: 'user'
          });
          
          setProfile(newProfile);
        } else {
          setProfile(userProfile);
        }
        
        // Map user data to our User interface
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: userProfile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: userProfile?.role || 'user',
        });
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated,
        login,
        logout,
        register,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 