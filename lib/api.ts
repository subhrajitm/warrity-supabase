// Types
import { Warranty, WarrantyInput, WarrantyDocument } from '../types/warranty';
import { Product } from '../types/product';

// Extend the Product type to include MongoDB _id field
export interface ProductData extends Product {
  _id?: string; // MongoDB ID
}

interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
}

// API Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  phone?: string;
  bio?: string;
  profilePicture?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    instagram?: string;
  };
  preferences?: {
    emailNotifications: boolean;
    reminderDays: number;
    theme?: string;
    notifications?: boolean;
    language?: string;
  };
  createdAt: string;
  updatedAt: string;
}

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
  totalWarranties: number;
  activeWarranties: number;
  expiringWarranties: number;
  expiredWarranties: number;
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

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
const UPLOAD_BASE_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || 'http://localhost:5001/uploads';

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
  } = {}
): Promise<ApiResponse<T>> {
  const { 
    cancelPrevious = true, 
    timeout = DEFAULT_TIMEOUT,
    retries = MAX_RETRIES,
    cache = method === 'GET',  // Only cache GET requests by default
    forceFresh = false
  } = options;

  // Generate a cache key for GET requests
  const cacheKey = method === 'GET' ? `${method}:${endpoint}` : null;
  
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
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetchWithRetry(url, requestOptions, retries);
    const result = await processResponse<T>(response);
    
    // Cache successful GET responses
    if (cacheKey && cache && result.data) {
      requestCache.set(cacheKey, result.data);
    }
    
    return result;
  } catch (error) {
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

// Warranty API
export const warrantyApi = {
  getAllWarranties: async () => {
    const response = await apiRequest<Warranty[] | { warranties: Warranty[] }>('/warranties', 'GET');
    
    // Handle both response formats (array or object with warranties property)
    if (response.error) {
      return { error: response.error, data: [] };
    }
    
    // Check if response.data is an array or has a warranties property
    const warranties = Array.isArray(response.data) 
      ? response.data 
      : (response.data as { warranties: Warranty[] }).warranties || [];
      
    return { data: warranties };
  },
  
  getWarrantyById: async (id: string) => {
    // Check if id is undefined or empty
    if (!id || id === 'undefined') {
      return { error: 'Invalid warranty ID' };
    }
    
    const response = await apiRequest<Warranty | { warranty: Warranty }>(`/warranties/${id}`, 'GET');
    
    // Handle both response formats (object or object with warranty property)
    if (response.error) {
      return { error: response.error };
    }
    
    // Check if response.data has a warranty property
    const warranty = (response.data as { warranty?: Warranty }).warranty || response.data;
    
    return { data: warranty as Warranty };
  },
  
  createWarranty: async (warrantyData: WarrantyInput) => {
    try {
      const response = await apiRequest<Warranty | { warranty: Warranty }>('/warranties', 'POST', warrantyData);
      
      // Handle both response formats (object or object with warranty property)
      if (response.error) {
        // Try to parse validation errors if present
        let errorMessage = response.error;
        
        try {
          // Check if the response contains a JSON string with validation errors
          if (typeof response.error === 'string' && response.error.includes('Validation error')) {
            const match = response.error.match(/{.*}/);
            if (match) {
              const errorObj = JSON.parse(match[0]);
              if (errorObj.errors && Array.isArray(errorObj.errors)) {
                // Return detailed validation errors
                return { 
                  error: 'Validation error', 
                  validationErrors: errorObj.errors 
                };
              }
            }
          }
        } catch (e) {
          console.error('Error parsing validation errors:', e);
        }
        
        return { error: errorMessage };
      }
      
      // Check if response.data has a warranty property
      const warranty = (response.data as { warranty?: Warranty }).warranty || response.data;
      
      return { data: warranty as Warranty };
    } catch (error) {
      console.error('Error creating warranty:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
    }
  },
  
  updateWarranty: (id: string, warrantyData: Partial<Warranty>) => 
    apiRequest<{ warranty: Warranty }>(`/warranties/${id}`, 'PUT', warrantyData),
  
  deleteWarranty: (id: string) => 
    apiRequest(`/warranties/${id}`, 'DELETE'),
  
  getExpiringWarranties: () => 
    apiRequest<{ warranties: Warranty[] }>('/warranties/expiring', 'GET'),
  
  uploadWarrantyDocument: (warrantyId: string, file: File) => 
    uploadFile<{ url: string }>(`/warranties/${warrantyId}/documents`, file, 'document'),
  
  deleteWarrantyDocument: (warrantyId: string, documentId: string) => 
    apiRequest(`/warranties/${warrantyId}/documents/${documentId}`, 'DELETE'),
  
  getWarrantyStats: () => 
    apiRequest<{ stats: DashboardStats }>('/warranties/stats/overview', 'GET'),
  
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
};

// Error handling utility
function handleApiError(error: any): ApiResponse<any> {
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