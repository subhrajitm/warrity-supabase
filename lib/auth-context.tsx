"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authApi, userApi, handleApiError } from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
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
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await authApi.getCurrentUser();
        if (response.error) {
          // Token might be expired, try to refresh
          const refreshResponse = await authApi.refreshToken();
          if (refreshResponse.error) {
            // Refresh failed, clear token
            localStorage.removeItem('authToken');
            setUser(null);
            setIsLoading(false);
            return;
          }
          
          // Save new token and try again
          if (refreshResponse.data?.token) {
            localStorage.setItem('authToken', refreshResponse.data.token);
            const retryResponse = await authApi.getCurrentUser();
            if (retryResponse.error) {
              localStorage.removeItem('authToken');
              setUser(null);
            } else if (retryResponse.data?.user) {
              setUser(retryResponse.data.user);
            }
          }
        } else if (response.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string, shouldRedirect: boolean = true): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting login with:', { email });
      const response = await authApi.login({ email, password });
      
      console.log('Login response:', response);
      
      if (response.error) {
        console.error('Login error:', response.error);
        toast.error(response.error);
        return false;
      }
      
      if (!response.data) {
        console.error('No data in login response');
        toast.error('Invalid login response');
        return false;
      }
      
      const { token, user: userData } = response.data;
      
      if (!token || !userData) {
        console.error('Missing token or user data in response');
        toast.error('Invalid login response');
        return false;
      }
      
      // Save token
      localStorage.setItem('authToken', token);
      
      // Set user data
      setUser(userData);
      toast.success('Login successful');
      
      // Only redirect if shouldRedirect is true
      if (shouldRedirect) {
        const redirectPath = userData.role === 'admin' ? '/admin' : '/user';
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
      // Clear local state
      localStorage.removeItem('authToken');
      setUser(null);
      
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
      const response = await authApi.register(userData);
      
      if (response.error) {
        handleApiError(response.error);
        return false;
      }
      
      if (response.data?.token) {
        localStorage.setItem('authToken', response.data.token);
        setUser(response.data.user);
        toast.success('Registration successful');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Registration failed:', error);
      toast.error('Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: ProfileUpdateData): Promise<boolean> => {
    try {
      // Validate profile data
      if (!validateProfileData(profileData)) {
        toast.error("Invalid profile data");
        return false;
      }

      // Transform preferences data to match API requirements
      const transformedData = {
        ...profileData,
        preferences: {
          emailNotifications: profileData.preferences?.emailNotifications ?? true,
          reminderDays: profileData.preferences?.reminderDays ?? 30,
          notifications: Boolean(profileData.preferences?.notifications) || undefined
        }
      };

      // Transform social links to ensure they are valid URLs or undefined
      if (transformedData.socialLinks) {
        const transformedSocialLinks: Record<string, string | undefined> = {};
        
        for (const [platform, value] of Object.entries(transformedData.socialLinks)) {
          if (!value) {
            // If the value is empty, set it to undefined
            transformedSocialLinks[platform] = undefined;
          } else if (!value.startsWith('http')) {
            // If it's not a full URL, construct one based on the platform
            const baseUrls: Record<string, string> = {
              twitter: 'https://twitter.com/',
              linkedin: 'https://linkedin.com/in/',
              github: 'https://github.com/',
              instagram: 'https://instagram.com/'
            };
            transformedSocialLinks[platform] = `${baseUrls[platform]}${value}`;
          } else {
            // If it's already a full URL, use it as is
            transformedSocialLinks[platform] = value;
          }
        }
        
        transformedData.socialLinks = transformedSocialLinks;
      }

      console.log('Sending profile update:', transformedData);
      const response = await userApi.updateProfile(transformedData);
      console.log('Profile update response:', response);

      if (response.error) {
        // Handle validation errors
        if (response.error.includes('validation failed')) {
          const errorMessages = response.error.split(', ');
          toast.error(errorMessages.join('\n'));
          return false;
        }
        toast.error(response.error);
        return false;
      }

      const updatedUser = response.data;
      if (updatedUser) {
        // Update local user state with the new data
        setUser(prevUser => {
          if (!prevUser) return updatedUser;
          
          // Create a new user object with all the updated fields
          const newUser = {
            ...prevUser,
            name: updatedUser.name || prevUser.name,
            phone: updatedUser.phone || prevUser.phone,
            bio: updatedUser.bio || prevUser.bio,
            socialLinks: updatedUser.socialLinks || prevUser.socialLinks,
            preferences: {
              ...prevUser.preferences,
              ...updatedUser.preferences
            }
          };

          // Force a re-render by creating a new object
          return { ...newUser };
        });

        // Force a refresh of the user data
        await refreshUser();
        
        toast.success("Profile updated successfully");
        return true;
      }

      toast.error("Failed to update profile");
      return false;
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authApi.getCurrentUser();
      if (response.data?.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('User refresh failed:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
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