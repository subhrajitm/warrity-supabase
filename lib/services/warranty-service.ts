import { amplifyGet, amplifyPost, amplifyPut, amplifyDelete } from '@/lib/amplify-api';

export interface Warranty {
  _id: string;
  userId: string;
  productId: string;
  purchaseDate: string;
  expiryDate: string;
  attachments?: string[];
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyInput {
  productId: string;
  purchaseDate: string;
  expiryDate: string;
  attachments?: string[];
  status?: string;
}

export interface WarrantyListResponse {
  warranties: Warranty[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface WarrantyDetailResponse {
  warranty: Warranty;
}

// Helper to get the auth token - this uses the existing token management
// instead of Amplify Auth which isn't set up yet
const getAuthToken = async (): Promise<string | undefined> => {
  try {
    // Use localStorage directly for now (or your existing auth mechanism)
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
    return token || undefined;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
};

// Get a list of warranties for the current user
export const getWarranties = async (page = 1, limit = 10): Promise<WarrantyListResponse> => {
  try {
    return await amplifyGet<WarrantyListResponse>('/warranties', { page, limit });
  } catch (error) {
    console.error('Error getting warranties:', error);
    throw error;
  }
};

// Get a specific warranty by ID
export const getWarranty = async (id: string): Promise<WarrantyDetailResponse> => {
  try {
    return await amplifyGet<WarrantyDetailResponse>(`/warranties/${id}`);
  } catch (error) {
    console.error(`Error getting warranty with ID ${id}:`, error);
    throw error;
  }
};

// Create a new warranty
export const createWarranty = async (warrantyData: WarrantyInput): Promise<WarrantyDetailResponse> => {
  try {
    return await amplifyPost<WarrantyDetailResponse>('/warranties', warrantyData);
  } catch (error) {
    console.error('Error creating warranty:', error);
    throw error;
  }
};

// Update an existing warranty
export const updateWarranty = async (id: string, warrantyData: Partial<WarrantyInput>): Promise<WarrantyDetailResponse> => {
  try {
    return await amplifyPut<WarrantyDetailResponse>(`/warranties/${id}`, warrantyData);
  } catch (error) {
    console.error(`Error updating warranty with ID ${id}:`, error);
    throw error;
  }
};

// Delete a warranty
export const deleteWarranty = async (id: string): Promise<void> => {
  try {
    await amplifyDelete<void>(`/warranties/${id}`);
  } catch (error) {
    console.error(`Error deleting warranty with ID ${id}:`, error);
    throw error;
  }
}; 