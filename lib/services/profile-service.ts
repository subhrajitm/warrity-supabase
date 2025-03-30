import supabase from '@/lib/supabase-config';
import { getCurrentUser } from '@/lib/supabase-auth';
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

// Helper function to check if profiles table exists
async function checkProfilesTable(): Promise<boolean> {
  try {
    // Try a simple query first
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === '42P01') { // Table doesn't exist
        console.warn('Profiles table does not exist');
        return false;
      }
      // For other errors, just log and continue
      console.error('Error checking profiles table:', error);
      return true; // Assume table exists for other errors
    }
    
    return true;
  } catch (error) {
    console.error('Error checking profiles table:', error);
    return false;
  }
}

/**
 * Get the current user's profile
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  // Don't attempt to get profile on the server side
  if (typeof window === 'undefined') {
    console.info('getCurrentProfile called on server side, returning null');
    return null;
  }

  try {
    // Get the current user
    let user;
    try {
      user = await getCurrentUser();
    } catch (error) {
      console.warn('Failed to get current user during profile fetch:', error);
      return null;
    }

    if (!user) {
      console.info('No authenticated user found during profile fetch');
      return null;
    }

    // Get the user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // Return null instead of throwing to make handling easier
      return null;
    }

    if (!data) {
      console.info(`No profile found for user ${user.id}`);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error('Unexpected error in getCurrentProfile:', error);
    return null;
  }
};

/**
 * Get a profile by ID
 */
export const getProfileById = async (id: string): Promise<Profile | null> => {
  if (!id) {
    console.warn('getProfileById called with empty ID');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Check if this is a not found error, which is expected in some cases
      if (error.code === 'PGRST116') {
        console.info(`No profile found for ID ${id}`);
        return null;
      }
      
      console.error(`Error fetching profile for ID ${id}:`, error);
      return null;
    }

    if (!data) {
      console.info(`No profile data returned for ID ${id}`);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error(`Unexpected error in getProfileById for ID ${id}:`, error);
    return null;
  }
};

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
    // First check if profiles table exists
    const tableExists = await checkProfilesTable();
    if (!tableExists) {
      console.warn('Profiles table does not exist, cannot create profile');
      return null;
    }
    
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
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          ...profile,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (insertError) {
      console.error('Error inserting profile:', insertError);
      
      // If insert fails, check if profile already exists
      try {
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single();
        
        if (existingProfile) {
          console.log('Profile already exists, returning existing profile');
          return existingProfile;
        }
      } catch (checkError) {
        console.error('Error checking for existing profile:', checkError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error creating profile:', error);
    return null;
  }
}

/**
 * Uploads a profile picture to Supabase Storage
 * @param file The file to upload
 * @param userId The user ID
 */
export const uploadProfilePicture = async (file: File, userId: string): Promise<string | null> => {
  try {
    const bucket = 'profile-pictures';
    
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
 * Subscribes to changes in a profile
 * @param userId The user ID to subscribe to changes for
 * @param onUpdate The callback to execute when the profile is updated
 */
export const subscribeToProfileChanges = (userId: string, onUpdate: (payload: any) => void) => {
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
        onUpdate(payload);
      }
    )
    .subscribe();
  
  // Return the subscription for cleanup
  return subscription;
} 