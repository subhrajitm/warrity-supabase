// Types
import { Warranty, WarrantyInput, WarrantyDocument, User, Product } from '../types/warranty';
import { getWarranties } from './services/warranty-service';

// Re-export everything from the Supabase adapter
export * from './api-adapter';

// Keep the Product type for backward compatibility 
export interface ProductData extends Product {
  _id?: string; // MongoDB ID
}

// Keep the original API response interface for compatibility
export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

// API Types
interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  location: string;
  category: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface DashboardStats {
  total: number;
  active: number;
  expiring: number;
  expired: number;
  warrantyByCategory: {
    category: string;
    count: number;
  }[];
  recentWarranties: Warranty[];
}

interface UserActivity {
  id: string;
  userId: User['id'];
  action: string;
  resourceType: string;
  resourceId: string;
  timestamp: string;
  details?: Record<string, any>;
}

interface Settings {
  notificationSettings: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    warrantyExpiryAlerts: boolean;
    systemAlerts: boolean;
  };
  emailSettings: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  systemSettings: {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
}

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not set');
}

// Remove any trailing slash from the API base URL
const cleanApiBaseUrl = API_BASE_URL.replace(/\/$/, '');

// Add request timeout and retry configuration
const DEFAULT_TIMEOUT = 8000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

// Request cache implementation
class RequestCache {
  cache: Map<string, { data: any; timestamp: number }>;
  maxAge: number; // Cache expiry in ms

  constructor(maxAge = 60000) { // Default 1 minute
    this.cache = new Map();
    this.maxAge = maxAge;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

const requestCache = new RequestCache();

// Utility to get the auth token from localStorage
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('authToken');
}

// Utility to set the auth token in localStorage
export function setAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('authToken', token);
}

// Utility to remove the auth token from localStorage
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('authToken');
}

// Utility to check if the user is authenticated
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

// Fetch with timeout utility
async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    ...fetchOptions,
    signal: controller.signal
  });

  clearTimeout(id);
  return response;
}

// Process API response
async function processResponse<T>(response: Response): Promise<ApiResponse<T>> {
  // If the response is successful, parse and return the data
  if (response.ok) {
    try {
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      // Handle the case where the response is not JSON
      return { data: null, error: 'Invalid JSON response' };
    }
  }

  // Handle error responses
  let error = 'An error occurred';
  const { status } = response;

  try {
    const errorData = await response.json();
    error = errorData.message || error;
    
    // Show error toast for non-successful responses
    // toast.error(error);
    
    // Handle specific status codes
    if (status === 401) {
      // Clear token and redirect to login
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
  } catch (e) {
    // If the response is not JSON, use the status text
    error = response.statusText || error;
    // toast.error(error);
  }
  return { data: null, error };
}

// Fetch with retry utility
async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number } = {},
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetchWithTimeout(url, options);
    if (!response.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError' && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

// Debounce utility for search functions
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): Promise<ReturnType<T>> {
    return new Promise((resolve) => {
      if (timeout) clearTimeout(timeout);
      
      timeout = setTimeout(() => {
        const result = func(...args);
        resolve(result);
      }, wait);
    });
  };
}

// Main API request function
export async function apiRequest<T = any>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  headers?: Record<string, string>,
  options: {
    cancelPrevious?: boolean;
    timeout?: number;
    retries?: number;
    cache?: boolean;
    forceFresh?: boolean;
    params?: Record<string, any>;
  } = {}
): Promise<ApiResponse<T>> {
  const { 
    cancelPrevious = true, 
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    cache = method === 'GET',  // Only cache GET requests by default
    forceFresh = false,
    params
  } = options;

  // Generate a cache key for GET requests
  const cacheKey = method === 'GET' ? `${method}:${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ''}` : null;
  
  // Check cache for GET requests if not forcing fresh data
  if (cacheKey && cache && !forceFresh) {
    const cachedData = requestCache.get(cacheKey);
    if (cachedData) {
      return { data: cachedData, error: null };
    }
  }

  // Prepare headers
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers
  };

  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    requestHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Prepare request options
  const requestOptions: RequestInit & { timeout?: number } = {
    method,
    headers: requestHeaders,
    credentials: 'include',
    timeout
  };

  // Add body for non-GET requests
  if (method !== 'GET' && data) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    // Make the request
    const url = `${cleanApiBaseUrl}${endpoint}${params ? `?${new URLSearchParams(params).toString()}` : ''}`;
    console.log('Making API request to:', url); // Add logging
    const response = await fetchWithRetry(url, requestOptions, retries);
    const result = await processResponse<T>(response);
    
    // Cache successful GET responses
    if (cacheKey && cache && result.data) {
      requestCache.set(cacheKey, result.data);
    }
    
    return result;
  } catch (error) {
    console.error('API request error:', error); // Add error logging
    return handleApiError(error);
  }
}

// Queued request function for long-running operations
export async function queuedRequest<T = any>(
  endpoint: string,
  method: string = 'POST',
  data?: any,
  headers?: Record<string, string>,
  options: {
    timeout?: number;
    retries?: number;
    pollingInterval?: number;
    maxPolls?: number;
  } = {}
): Promise<ApiResponse<T>> {
  const { 
    timeout = 10000,
    retries = 1,
    pollingInterval = 2000,
    maxPolls = 15
  } = options;

  // Initial request to queue the job
  const initialResponse = await apiRequest<{ jobId: string }>(
    endpoint,
    method,
    data,
    headers,
    { timeout, retries }
  );

  if (initialResponse.error || !initialResponse.data?.jobId) {
    return initialResponse as ApiResponse<T>;
  }

  const jobId = initialResponse.data.jobId;
  const statusEndpoint = `${endpoint}/status/${jobId}`;

  // Poll for job completion
  let pollCount = 0;
  while (pollCount < maxPolls) {
    await new Promise(resolve => setTimeout(resolve, pollingInterval));
    pollCount++;

    const statusResponse = await apiRequest<{ 
      status: 'pending' | 'processing' | 'completed' | 'failed';
      result?: T;
      error?: string;
    }>(statusEndpoint, 'GET');

    if (statusResponse.error) {
      return statusResponse as ApiResponse<T>;
    }

    const { status, result, error } = statusResponse.data!;

    if (status === 'completed' && result) {
      return { data: result, error: null };
    }

    if (status === 'failed') {
      return { data: null, error: error || 'Job failed' };
    }

    // Continue polling for pending or processing status
  }

  // If we've reached max polls without completion
  return { data: null, error: 'Operation timed out' };
}

// Auth API
export const authApi = {
  register: (userData: { email: string; password: string; name: string }) => 
    apiRequest<{ user: User; token: string }>('/auth/register', 'POST', userData),
  login: (credentials: { email: string; password: string }) => 
    apiRequest<{ user: User; token: string }>('/auth/login', 'POST', credentials),
  logout: () => apiRequest('/auth/logout', 'POST'),
  getCurrentUser: () => apiRequest<{ user: User }>('/auth/me', 'GET'),
  changePassword: (passwordData: { currentPassword: string; newPassword: string }) => 
    apiRequest('/auth/change-password', 'POST', passwordData),
  refreshToken: () => apiRequest<{ token: string }>('/auth/refresh', 'POST'),
};

// User API
export const userApi = {
  getProfile: () => apiRequest<User>('/users/profile', 'GET'),
  updateProfile: (profileData: Partial<User>) => apiRequest<User>('/users/profile', 'PUT', profileData),
  changePassword: (passwordData: { currentPassword: string, newPassword: string }) => 
    apiRequest('/users/change-password', 'POST', passwordData),
  uploadProfilePicture: (file: File) => 
    uploadFile<{ url: string }>('/users/profile/picture', file, 'image'),
  getNotificationSettings: () => 
    apiRequest<{ settings: User['preferences'] }>('/users/notification-settings', 'GET'),
  updateNotificationSettings: (settings: Partial<User['preferences']>) => 
    apiRequest<{ settings: User['preferences'] }>('/users/notification-settings', 'PUT', settings),
  getUserActivity: () => 
    apiRequest<{ activities: UserActivity[] }>('/users/activity', 'GET'),
  deleteAccount: () => 
    apiRequest('/users/account', 'DELETE'),
  getUserById: (userId: User['id']) => 
    apiRequest<User>(`/users/${userId}`, 'GET')
};

// Import the required functions only, no interfaces to avoid type conflicts
import { supabaseGet } from './supabase-api';
import { getAllWarranties, getExpiringWarranties as getExpiringWarrantiesFromService } from './services/warranty-service';

// Warranty API
export const warrantyApi = {
  getAllWarranties: async () => {
    try {
      // Try to get warranties directly from the service first
      // This will provide mock data if the table doesn't exist
      const warranties = await getAllWarranties();
      
      console.log(`Retrieved ${warranties.length} warranties (including potential mock data)`);
      
      return {
        success: true,
        data: warranties // Return in the format expected by the app
      };
    } catch (directError) {
      console.error('Error fetching warranties directly:', directError);
      
      // Fall back to API approach
      try {
        const data = await supabaseGet('warranties');
        console.log('Retrieved warranties from API endpoint');
        return { success: true, data };
      } catch (apiError) {
        console.error('Error fetching warranties from API:', apiError);
        return { 
          success: false, 
          error: 'Failed to load warranties',
          data: [] // Return empty array to avoid undefined errors
        };
      }
    }
  },
  
  getWarrantyById: async (id: string) => {
    // Check if id is undefined or empty
    if (!id || id === 'undefined') {
      return { error: 'Invalid warranty ID' };
    }
    
    try {
      const response = await getWarranty(id);
      // Convert to the app's warranty format
      const warranty = convertSupabaseWarrantyToAppWarranty(response.warranty);
      return { data: warranty };
    } catch (error) {
      console.error(`Error getting warranty with ID ${id}:`, error);
      return { error: error instanceof Error ? error.message : 'Failed to load warranty' };
    }
  },
  
  createWarranty: async (warrantyData: WarrantyInput) => {
    try {
      // Convert from app warranty format to Supabase format
      const supabaseWarrantyData = convertAppWarrantyToSupabaseWarranty(warrantyData);
      const response = await createSupabaseWarranty(supabaseWarrantyData);
      // Convert back to app format for the response
      const warranty = convertSupabaseWarrantyToAppWarranty(response.warranty);
      return { data: warranty };
    } catch (error) {
      console.error('Error creating warranty:', error);
      return { error: error instanceof Error ? error.message : 'Failed to create warranty' };
    }
  },
  
  updateWarranty: async (id: string, warrantyData: Partial<WarrantyInput>) => {
    try {
      // Convert from app warranty format to Supabase format
      const supabaseWarrantyData = convertAppWarrantyToSupabaseWarranty(warrantyData as WarrantyInput);
      const response = await updateSupabaseWarranty(id, supabaseWarrantyData);
      // Convert back to app format for the response
      const warranty = convertSupabaseWarrantyToAppWarranty(response.warranty);
      return { data: warranty };
    } catch (error) {
      console.error(`Error updating warranty with ID ${id}:`, error);
      return { error: error instanceof Error ? error.message : 'Failed to update warranty' };
    }
  },
  
  deleteWarranty: async (id: string) => {
    try {
      await deleteSupabaseWarranty(id);
      return { data: { success: true } };
    } catch (error) {
      console.error(`Error deleting warranty with ID ${id}:`, error);
      return { error: error instanceof Error ? error.message : 'Failed to delete warranty' };
    }
  },
  
  getExpiringWarranties: async () => {
    try {
      // Use the service function that already handles expiring warranties
      const expiringWarranties = await getExpiringWarrantiesFromService(30); // Get warranties expiring in 30 days
      
      console.log(`Retrieved ${expiringWarranties.length} expiring warranties`);
      
      return { 
        success: true, 
        data: { warranties: expiringWarranties } 
      };
    } catch (directError) {
      console.error('Error fetching expiring warranties directly:', directError);
      
      // Fall back to API approach
      try {
        const data = await supabaseGet('warranties/expiring');
        console.log('Retrieved expiring warranties from API endpoint');
        return { success: true, data };
      } catch (apiError) {
        console.error('Error fetching expiring warranties from API:', apiError);
        return { 
          success: false, 
          error: 'Failed to load expiring warranties', 
          data: { warranties: [] } 
        };
      }
    }
  },
  
  uploadWarrantyDocument: async (warrantyId: string, file: File) => {
    try {
      const url = await uploadWarrantyDocument(file, warrantyId);
      return { data: { url } };
    } catch (error) {
      console.error('Error uploading warranty document:', error);
      return { error: error instanceof Error ? error.message : 'Failed to upload document' };
    }
  },
  
  deleteWarrantyDocument: async (warrantyId: string, documentIndex: number) => {
    try {
      // Get the warranty first
      const response = await getWarranty(warrantyId);
      const warranty = response.warranty;
      
      // Remove the document at the specified index
      if (warranty.documents && Array.isArray(warranty.documents)) {
        const updatedDocuments = [...warranty.documents];
        updatedDocuments.splice(documentIndex, 1);
        
        // Update the warranty with the modified documents array
        await updateSupabaseWarranty(warrantyId, { documents: updatedDocuments });
      }
      
      return { data: { success: true } };
    } catch (error) {
      console.error(`Error deleting warranty document:`, error);
      return { error: error instanceof Error ? error.message : 'Failed to delete document' };
    }
  },
  
  getWarrantyStats: async () => {
    try {
      const response = await getWarranties();
      const warranties = response.warranties;
      
      // Count warranties by status
      const active = warranties.filter(w => {
        if (!w.end_date) return false;
        return new Date(w.end_date) >= new Date();
      }).length;
      
      const expired = warranties.filter(w => {
        if (!w.end_date) return false;
        return new Date(w.end_date) < new Date();
      }).length;
      
      // Calculate average duration in months
      const warrantiesWithDuration = warranties.filter(w => w.duration_months);
      const avgDuration = warrantiesWithDuration.length > 0 
        ? warrantiesWithDuration.reduce((sum, w) => sum + (w.duration_months || 0), 0) / warrantiesWithDuration.length
        : 0;
      
      // Convert warranties to app format for the response
      const recentlyAdded = warranties
        .slice(0, 5)
        .map(convertSupabaseWarrantyToAppWarranty);
      
      return { 
        data: {
          total: warranties.length,
          active,
          expired,
          expiring: active - expired,
          avgDurationMonths: Math.round(avgDuration * 10) / 10,
          warrantyByCategory: [], // Would need to calculate this from the data
          recentWarranties: recentlyAdded
        } 
      };
    } catch (error) {
      console.error('Error getting warranty stats:', error);
      return { error: error instanceof Error ? error.message : 'Failed to load warranty statistics' };
    }
  },
  
  uploadDocument: async (file: File): Promise<WarrantyDocument | null> => {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      
      // Get the JWT token
      const token = getAuthToken();
      
      console.log('Token for API request:', token ? 'Token exists' : 'No token found');
      
      if (!token) {
        console.error('Authentication token not found');
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        credentials: 'include',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      return {
        name: file.name,
        path: data.filePath,
        uploadDate: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // In development mode or if configured to use mock data, return a mock document
      if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
        return {
          name: file.name,
          path: `/uploads/mock-${file.name}`,
          uploadDate: new Date().toISOString()
        };
      }
      
      return null;
    }
  }
};

// Helper function to convert Supabase warranty format to app warranty format
function convertSupabaseWarrantyToAppWarranty(supabaseWarranty: SupabaseWarranty): Warranty {
  // Create a dummy user and product for now
  // In a real implementation, these would be fetched from the appropriate tables
  const dummyUser: User = {
    _id: "dummy-user-id",
    name: "User",
    email: "user@example.com"
  };
  
  const dummyProduct: Product = {
    _id: "dummy-product-id",
    name: supabaseWarranty.warranty_provider || "Unknown Product",
    manufacturer: supabaseWarranty.warranty_type || "Unknown Manufacturer"
  };
  
  // Convert document format
  const documents: WarrantyDocument[] = (supabaseWarranty.documents || []).map(doc => {
    if (typeof doc === 'string') {
      return {
        name: doc.split('/').pop() || 'Document',
        path: doc,
        uploadDate: supabaseWarranty.created_at || new Date().toISOString()
      };
    }
    return {
      name: 'Document',
      path: doc,
      uploadDate: supabaseWarranty.created_at || new Date().toISOString()
    };
  });
  
  return {
    id: supabaseWarranty.id,
    _id: supabaseWarranty.id,
    user: dummyUser,
    product: dummyProduct,
    purchaseDate: supabaseWarranty.start_date || new Date().toISOString(),
    expirationDate: supabaseWarranty.end_date || new Date().toISOString(),
    warrantyProvider: supabaseWarranty.warranty_provider || "Unknown Provider",
    warrantyNumber: supabaseWarranty.id || "N/A",
    coverageDetails: supabaseWarranty.terms || "N/A",
    documents: documents,
    status: determineWarrantyStatus(supabaseWarranty),
    notes: JSON.stringify(supabaseWarranty.contact_info) || "",
    createdAt: supabaseWarranty.created_at || new Date().toISOString(),
    updatedAt: supabaseWarranty.updated_at || new Date().toISOString()
  };
}

// Helper function to determine warranty status based on Supabase warranty data
function determineWarrantyStatus(supabaseWarranty: SupabaseWarranty): 'active' | 'expiring' | 'expired' {
  if (!supabaseWarranty.end_date) return 'active';
  
  const now = new Date();
  const expiryDate = new Date(supabaseWarranty.end_date);
  const thirtyDaysFromNow = new Date(now.setDate(now.getDate() + 30));
  
  if (expiryDate < new Date()) {
    return 'expired';
  } else if (expiryDate <= thirtyDaysFromNow) {
    return 'expiring';
  } else {
    return 'active';
  }
}

// Helper function to convert app warranty format to Supabase warranty format
function convertAppWarrantyToSupabaseWarranty(appWarranty: WarrantyInput): SupabaseWarrantyInput {
  // Extract product ID if it's an object
  const productId = typeof appWarranty.product === 'string' ? 
    appWarranty.product : 
    (appWarranty.product._id || 'unknown');
    
  // Convert document paths
  const documents = appWarranty.documents?.map(doc => doc.path) || [];
  
  return {
    product_id: productId,
    warranty_provider: appWarranty.warrantyProvider,
    warranty_type: appWarranty.product && typeof appWarranty.product !== 'string' ? 
      appWarranty.product.manufacturer : 
      'Unknown',
    start_date: appWarranty.purchaseDate,
    end_date: appWarranty.expirationDate,
    terms: appWarranty.coverageDetails,
    documents: documents,
    contact_info: {
      notes: appWarranty.notes
    }
  };
}

// Product API
export const productApi = {
  getAllProducts: async () => {
    const response = await apiRequest<ProductData[] | { products: ProductData[] }>('/products', 'GET');
    
    // Handle both response formats (array or object with products property)
    if (response.error) {
      return { error: response.error, data: [] };
    }
    
    // Check if response.data is an array or has a products property
    const products = Array.isArray(response.data) 
      ? response.data 
      : (response.data as { products: ProductData[] }).products || [];
      
    return { data: products };
  },
  getProduct: async (productId: string) => {
    const response = await apiRequest<ProductData | { product: ProductData }>(`/products/${productId}`, 'GET');
    
    // Handle both response formats
    if (response.error) {
      return { error: response.error };
    }
    
    // Check if response.data has a product property
    const product = (response.data as { product?: ProductData }).product || response.data;
    
    return { data: product as ProductData };
  },
  createProduct: (productData: ProductData) => 
    apiRequest<{ product: ProductData }>('/products', 'POST', productData),
  updateProduct: (id: string, productData: Partial<ProductData>) => 
    apiRequest<{ product: ProductData }>(`/products/${id}`, 'PUT', productData),
  deleteProduct: (id: string) => 
    apiRequest(`/products/${id}`, 'DELETE'),
  getProductCategories: () => 
    apiRequest<{ categories: string[] }>('/products/categories', 'GET'),
  uploadProductImage: (productId: string, file: File) => 
    uploadFile<{ url: string }>(`/products/${productId}/image`, file, 'image'),
  searchProducts: debounce(async (query: string) => {
    return apiRequest<ProductData[]>(`/products/search?q=${encodeURIComponent(query)}`, 'GET');
  }, 300),
  generateProductReport: (productId: string) => 
    queuedRequest<{ reportUrl: string }>(
      `/products/${productId}/report`,
      'POST',
      undefined,
      undefined,
      { timeout: 30000 } // Longer timeout for report generation
    ),
  getProductWithCache: (productId: string, forceFresh = false) => 
    apiRequest<ProductData>(
      `/products/${productId}`,
      'GET',
      undefined,
      undefined,
      { cache: true, forceFresh }
    ),
  getCategoriesWithCache: (forceFresh = false) => 
    apiRequest<{ categories: string[] }>(
      '/products/categories',
      'GET',
      undefined,
      undefined,
      { cache: true, forceFresh }
    ),
  clearProductCache: () => {
    const productCachePattern = /^GET:\/products/;
    for (const [key] of requestCache.cache.entries()) {
      if (productCachePattern.test(key)) {
        requestCache.delete(key);
      }
    }
  }
};

// Calendar Events API
export const eventApi = {
  getAllEvents: () => apiRequest<{ events: Event[] }>('/events', 'GET'),
  getEventById: (id: string) => apiRequest<{ event: Event }>(`/events/${id}`, 'GET'),
  createEvent: (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => 
    apiRequest<{ event: Event }>('/events', 'POST', eventData),
  updateEvent: (id: string, eventData: Partial<Event>) => 
    apiRequest<{ event: Event }>(`/events/${id}`, 'PUT', eventData),
  deleteEvent: (id: string) => apiRequest(`/events/${id}`, 'DELETE'),
  getEventsByMonth: (year: number, month: number) => 
    apiRequest<{ events: Event[] }>(`/events/month/${year}/${month}`, 'GET'),
  getUpcomingEvents: (limit: number = 5) => 
    apiRequest<{ events: Event[] }>(`/events/upcoming?limit=${limit}`, 'GET'),
};

// Admin API
export const adminApi = {
  getDashboardStats: () => 
    apiRequest<{ stats: DashboardStats }>('/admin/dashboard/stats', 'GET'),
  getAllUsers: () => 
    apiRequest<{ users: User[] }>('/admin/users', 'GET'),
  getUserById: (userId: User['id']) => 
    apiRequest<{ user: User }>(`/admin/users/${userId}`, 'GET'),
  updateUser: (userId: User['id'], userData: Partial<User>) => 
    apiRequest<{ user: User }>(`/admin/users/${userId}`, 'PUT', userData),
  deleteUser: (userId: User['id']) => 
    apiRequest(`/admin/users/${userId}`, 'DELETE'),
  getAllWarranties: () => 
    apiRequest<{ warranties: Warranty[] }>('/admin/warranties', 'GET'),
  getWarrantyById: (warrantyId: string) => 
    apiRequest<{ warranty: Warranty }>(`/admin/warranties/${warrantyId}`, 'GET'),
  updateWarranty: (warrantyId: string, warrantyData: Partial<Warranty>) => 
    apiRequest<{ warranty: Warranty }>(`/admin/warranties/${warrantyId}`, 'PUT', warrantyData),
  deleteWarranty: (warrantyId: string) => 
    apiRequest(`/admin/warranties/${warrantyId}`, 'DELETE'),
  getSystemLogs: (page: number = 1, limit: number = 20) => 
    apiRequest<{ logs: any[]; total: number; page: number; limit: number }>(
      `/admin/logs?page=${page}&limit=${limit}`, 
      'GET'
    ),
  getSystemHealth: () => 
    apiRequest<{ status: string; uptime: number; memory: any; cpu: any }>(
      '/admin/health', 
      'GET'
    ),
  getSettings: () => 
    apiRequest<Settings>('/admin/settings', 'GET'),
  updateSettings: (settings: Settings) => 
    apiRequest<Settings>('/admin/settings', 'PUT', settings),
  getWarrantyAnalytics: () => 
    apiRequest<{
      totalWarranties: number;
      activeWarranties: number;
      expiringWarranties: number;
      expiredWarranties: number;
      warrantyByStatus: Array<{
        status: string;
        count: number;
      }>;
      warrantyByMonth: Array<{
        month: string;
        count: number;
      }>;
    }>('/admin/analytics/warranties', 'GET'),
  getProductAnalytics: () => 
    apiRequest<{
      totalProducts: number;
      productsByCategory: Array<{
        category: string;
        count: number;
      }>;
      topProducts: Array<{
        name: string;
        warrantyCount: number;
      }>;
    }>('/admin/analytics/products', 'GET'),
  getAdminLogs: (params?: {
    adminId?: string;
    resourceType?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => 
    apiRequest<{
      logs: Array<{
        id: string;
        adminId: {
          name: string;
          email: string;
        };
        action: string;
        resourceType: string;
        resourceId: string;
        details: any;
        ipAddress: string;
        userAgent: string;
        timestamp: string;
      }>;
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>('/admin/logs', 'GET', undefined, undefined, { params }),
};

// Error handling utility
export function handleApiError(error: any): ApiResponse<any> {
  let errorMessage = 'An error occurred';
  
  // Handle network errors
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    errorMessage = 'Network error. Please check your connection.';
    // toast.error(errorMessage);
    return { data: null, error: errorMessage };
  }
  
  // Handle timeout errors
  if (error instanceof Error && error.name === 'AbortError') {
    errorMessage = 'Request timed out. Please try again.';
    // toast.error(errorMessage);
    return { data: null, error: errorMessage };
  }
  
  // Handle authentication errors
  if (error instanceof Error && 'status' in error && (error as any).status === 401) {
    errorMessage = 'Your session has expired. Please log in again.';
    // toast.error(errorMessage);
    // Clear token and redirect to login
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return { data: null, error: errorMessage };
  }
  
  // Handle forbidden errors
  if (error instanceof Error && 'status' in error && (error as any).status === 403) {
    errorMessage = 'You do not have permission to perform this action.';
    // toast.error(errorMessage);
    return { data: null, error: errorMessage };
  }
  
  // Handle all other errors
  errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  // toast.error(errorMessage);
  return { data: null, error: errorMessage };
}

// File upload utility
export async function uploadFile<T = any>(
  endpoint: string,
  file: File,
  fileFieldName: string = 'file'
): Promise<ApiResponse<T>> {
  return new Promise((resolve) => {
    const formData = new FormData();
    formData.append(fileFieldName, file);
    
    const token = getAuthToken();
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_BASE_URL}${endpoint}`, true);
    
    // Set headers
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    
    // Set timeout
    xhr.timeout = 30000; // 30 seconds
    
    // Handle response
    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({ data: response, error: null });
        } catch (parseError) {
          const errorMessage = xhr.status === 404 
            ? `Upload endpoint not found: ${endpoint}`
            : `Upload failed: ${xhr.statusText || 'Unknown error'}`;
          // toast.error(errorMessage);
          resolve({ data: null, error: errorMessage });
        }
      };
      
      xhr.onerror = () => {
        const errorMessage = 'Network error during upload';
        // toast.error(errorMessage);
        resolve({ data: null, error: errorMessage });
      };
      
      xhr.ontimeout = () => {
        const errorMessage = 'Upload request timed out';
        // toast.error(errorMessage);
        resolve({ data: null, error: errorMessage });
      };
      
      xhr.onabort = () => {
        const errorMessage = 'Upload was cancelled';
        // toast.error(errorMessage);
        resolve({ data: null, error: errorMessage });
      };
      
      // Track upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          console.log(`Upload progress: ${percentComplete}%`);
        }
      };
      
      // Send the form data
      xhr.send(formData);
    };
  });
}

// Mock data utility for development
export function getMockData<T>(endpoint: string, mockData: T): ApiResponse<T> {
  console.log(`[MOCK] GET ${endpoint}`);
  return { data: mockData, error: null };
}

// Logout utility
export function logout(): void {
  removeAuthToken();
  // Call the logout API endpoint
  authApi.logout().catch(console.error);
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}