/**
 * API Adapter for Supabase Integration
 * 
 * This file provides adapter functions to bridge the existing API usage
 * with the new Supabase implementation.
 */

import { supabaseGet, supabasePost, supabasePut, supabaseDelete } from './supabase-api';
import { getCurrentUser, signInWithEmail, signUpWithEmail, signOut, updateProfile } from './supabase-auth';

/**
 * Adapter for amplifyGet, using Supabase instead
 */
export async function amplifyGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Record<string, any>
): Promise<T> {
  return supabaseGet<T>(path, params, options);
}

/**
 * Adapter for amplifyPost, using Supabase instead
 */
export async function amplifyPost<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  return supabasePost<T>(path, data, options);
}

/**
 * Adapter for amplifyPut, using Supabase instead
 */
export async function amplifyPut<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  return supabasePut<T>(path, data, options);
}

/**
 * Adapter for amplifyDelete, using Supabase instead
 */
export async function amplifyDelete<T>(
  path: string,
  options?: Record<string, any>
): Promise<T> {
  return supabaseDelete<T>(path, options);
}

/**
 * API objects for different domains
 * These map to the existing API imports used throughout the application
 */

// Auth API methods
export const authApi = {
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const { user, session } = await signInWithEmail(email, password);
      return { data: { user, token: session?.access_token }, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  register: async (userData: { email: string; password: string; name: string }) => {
    try {
      const { user, session } = await signUpWithEmail(userData.email, userData.password, {
        name: userData.name
      });
      return { data: { user, token: session?.access_token }, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  logout: async () => {
    try {
      await signOut();
      return { data: true, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getCurrentUser: async () => {
    try {
      const user = await getCurrentUser();
      return { data: user, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  refreshToken: async () => {
    // No direct equivalent in Supabase for token refresh - it's handled automatically
    // This is kept for API compatibility
    try {
      const user = await getCurrentUser();
      return { data: { user }, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  changePassword: async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) => {
    try {
      // Supabase requires authentication for password change
      // The current session should already be authenticated
      const { data, error } = await supabasePost<any>('/auth/password', { currentPassword, newPassword });
      if (error) throw new Error(error);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
};

// User API methods
export const userApi = {
  updateProfile: async (userData: any) => {
    try {
      const result = await updateProfile(userData);
      return { data: result, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  uploadProfilePicture: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Upload to Supabase storage instead of the API
      const { data, error } = await supabasePost<any>('/user/profile-picture', { file: formData });
      if (error) throw new Error(error);
      
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
};

// Warranty API methods
export const warrantyApi = {
  getAllWarranties: async () => {
    try {
      const data = await supabaseGet<any>('/table/warranties');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getWarrantyById: async (id: string) => {
    try {
      const data = await supabaseGet<any>(`/table/warranties/${id}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  createWarranty: async (warrantyData: any) => {
    try {
      const data = await supabasePost<any>('/table/warranties', warrantyData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  updateWarranty: async (id: string, warrantyData: any) => {
    try {
      const data = await supabasePut<any>(`/table/warranties/${id}`, warrantyData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  deleteWarranty: async (id: string) => {
    try {
      const data = await supabaseDelete<any>(`/table/warranties/${id}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getExpiringWarranties: async () => {
    try {
      const data = await supabaseGet<any>('/warranties/expiring');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getWarrantyStats: async () => {
    try {
      const data = await supabaseGet<any>('/warranties/stats');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  uploadDocument: async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const data = await supabasePost<any>('/warranties/documents', { file: formData });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
};

// Product API methods
export const productApi = {
  getAllProducts: async () => {
    try {
      const data = await supabaseGet<any>('/table/products');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getProductById: async (id: string) => {
    try {
      const data = await supabaseGet<any>(`/table/products/${id}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  createProduct: async (productData: any) => {
    try {
      const data = await supabasePost<any>('/table/products', productData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  updateProduct: async (id: string, productData: any) => {
    try {
      const data = await supabasePut<any>(`/table/products/${id}`, productData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  deleteProduct: async (id: string) => {
    try {
      const data = await supabaseDelete<any>(`/table/products/${id}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
};

// Admin API methods
export const adminApi = {
  getAllUsers: async () => {
    try {
      const data = await supabaseGet<any>('/admin/users');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getUserById: async (id: string) => {
    try {
      const data = await supabaseGet<any>(`/admin/users/${id}`);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getAllWarranties: async () => {
    try {
      const data = await supabaseGet<any>('/admin/warranties');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getWarrantyAnalytics: async () => {
    try {
      const data = await supabaseGet<any>('/admin/analytics/warranties');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getProductAnalytics: async () => {
    try {
      const data = await supabaseGet<any>('/admin/analytics/products');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getAdminLogs: async (params?: any) => {
    try {
      const data = await supabaseGet<any>('/admin/logs', params);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  getSettings: async () => {
    try {
      const data = await supabaseGet<any>('/admin/settings');
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  },
  
  updateSettings: async (settings: any) => {
    try {
      const data = await supabasePut<any>('/admin/settings', settings);
      return { data, error: null };
    } catch (error) {
      return { data: null, error: (error as Error).message };
    }
  }
}; 