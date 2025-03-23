import supabase from '../supabase-config';
import { supabaseGet, supabasePost, supabasePut } from '../supabase-api';

export interface Profile {
  id: string;
  email: string;
  name?: string;
  role: string;
  profile_picture?: string;
  bio?: string;
  social_links?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  created_at?: string;
  updated_at?: string;
}

/**
 * Get the current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return null; // Server-side, no profile available
    }
    
    // Get current user ID
    try {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      
      if (!user) return null;
      
      // Get profile for this user ID
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return profile;
    } catch (authError) {
      console.warn('Error getting current user:', authError);
      return null;
    }
  } catch (error) {
    console.error('Error getting current profile:', error);
    return null;
  }
}

/**
 * Get a profile by ID
 */
export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    if (!id) {
      console.warn('getProfileById called without an ID');
      return null;
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found error - this is normal if profile doesn't exist yet
        console.log(`No profile found for ID ${id}`);
        return null;
      }
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error(`Error getting profile with ID ${id}:`, error);
    return null;
  }
}

/**
 * Get all profiles (admin only)
 */
export async function getAllProfiles(): Promise<Profile[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting all profiles:', error);
    return [];
  }
}

/**
 * Update a profile
 */
export async function updateProfile(profile: Partial<Profile>): Promise<Profile | null> {
  try {
    // Make sure we have the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    // Only allow updating the current user's profile unless specified
    const profileId = profile.id || user.id;
    
    // Remove id from the data to update (can't update primary key)
    const { id, ...dataToUpdate } = profile;
    
    const { data, error } = await supabase
      .from('profiles')
      .update(dataToUpdate)
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

/**
 * Create a profile (used when a new user signs up)
 */
export async function createProfile(profile: Partial<Profile>): Promise<Profile | null> {
  try {
    // Get current user ID if not provided
    if (!profile.id) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      profile.id = user.id;
    }
    
    // Get email from auth if not provided
    if (!profile.email) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        profile.email = user.email;
      } else {
        throw new Error('Email is required');
      }
    }
    
    // Set default role if not provided
    if (!profile.role) {
      profile.role = 'user';
    }
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
}

/**
 * Upload a profile picture
 */
export async function uploadProfilePicture(file: File): Promise<string | null> {
  try {
    // Get current user ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');
    
    // Create a unique file path
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}-${Date.now()}.${fileExt}`;
    
    // Check if the bucket exists before trying to upload
    let bucketExists = false;
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      bucketExists = buckets?.some(bucket => bucket.name === 'profile_pictures') || false;
    } catch (bucketError) {
      console.warn('Error checking for bucket existence:', bucketError);
      // Continue with the upload - it will fail if the bucket doesn't exist
    }
    
    // If bucket doesn't exist, use an external service or default avatar
    if (!bucketExists) {
      console.warn('Profile pictures bucket does not exist, using workaround');
      
      // Option 1: Return a default avatar URL
      const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=random`;
      
      // Update the profile with the default avatar
      await updateProfile({
        id: user.id,
        profile_picture: defaultAvatarUrl
      });
      
      return defaultAvatarUrl;
    }
    
    // Upload to Supabase Storage if bucket exists
    const { data, error } = await supabase.storage
      .from('profile_pictures')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) throw error;
    
    // Get the public URL
    const { data: publicURL } = supabase.storage
      .from('profile_pictures')
      .getPublicUrl(filePath);
    
    // Update the user's profile with the new picture URL
    if (publicURL.publicUrl) {
      await updateProfile({
        id: user.id,
        profile_picture: publicURL.publicUrl
      });
    }
    
    return publicURL.publicUrl;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    
    // Fallback to a generated avatar if upload fails
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');
      
      const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email || 'User')}&background=random`;
      
      // Update the profile with the default avatar
      await updateProfile({
        id: user.id,
        profile_picture: defaultAvatarUrl
      });
      
      return defaultAvatarUrl;
    } catch (fallbackError) {
      console.error('Error creating fallback avatar:', fallbackError);
      return null;
    }
  }
}

/**
 * Subscribe to profile changes
 */
export function subscribeToProfileChanges(
  callback: (payload: any) => void, 
  userId?: string
) {
  // Build the filter if a user ID is provided
  const filter = userId ? `id=eq.${userId}` : undefined;
  
  // Create a unique channel name
  const channelName = userId 
    ? `profile-changes-${userId}` 
    : 'profile-changes-all';
  
  // Subscribe to changes
  const subscription = supabase.channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'profiles',
        filter
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  // Return the subscription for cleanup
  return subscription;
} 