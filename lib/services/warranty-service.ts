import { post, get, put, del } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

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

// Helper to get the auth token for requests
const getAuthToken = async (): Promise<string | undefined> => {
  try {
    const { tokens } = await fetchAuthSession();
    return tokens?.accessToken.toString();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
};

// Get a list of warranties for the current user
export const getWarranties = async (page = 1, limit = 10): Promise<WarrantyListResponse> => {
  try {
    const token = await getAuthToken();
    
    const response = await get({
      apiName: 'warrity-api',
      path: `/warranties?page=${page}&limit=${limit}`,
      options: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    return response.body as WarrantyListResponse;
  } catch (error) {
    console.error('Error getting warranties:', error);
    throw error;
  }
};

// Get a specific warranty by ID
export const getWarranty = async (id: string): Promise<WarrantyDetailResponse> => {
  try {
    const token = await getAuthToken();
    
    const response = await get({
      apiName: 'warrity-api',
      path: `/warranties/${id}`,
      options: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    return response.body as WarrantyDetailResponse;
  } catch (error) {
    console.error(`Error getting warranty with ID ${id}:`, error);
    throw error;
  }
};

// Create a new warranty
export const createWarranty = async (warrantyData: WarrantyInput): Promise<WarrantyDetailResponse> => {
  try {
    const token = await getAuthToken();
    
    const response = await post({
      apiName: 'warrity-api',
      path: '/warranties',
      options: {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: warrantyData
      }
    });
    
    return response.body as WarrantyDetailResponse;
  } catch (error) {
    console.error('Error creating warranty:', error);
    throw error;
  }
};

// Update an existing warranty
export const updateWarranty = async (id: string, warrantyData: Partial<WarrantyInput>): Promise<WarrantyDetailResponse> => {
  try {
    const token = await getAuthToken();
    
    const response = await put({
      apiName: 'warrity-api',
      path: `/warranties/${id}`,
      options: {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: warrantyData
      }
    });
    
    return response.body as WarrantyDetailResponse;
  } catch (error) {
    console.error(`Error updating warranty with ID ${id}:`, error);
    throw error;
  }
};

// Delete a warranty
export const deleteWarranty = async (id: string): Promise<void> => {
  try {
    const token = await getAuthToken();
    
    await del({
      apiName: 'warrity-api',
      path: `/warranties/${id}`,
      options: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  } catch (error) {
    console.error(`Error deleting warranty with ID ${id}:`, error);
    throw error;
  }
}; 