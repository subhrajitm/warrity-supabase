import supabase from './supabase-config';
import { getAllWarranties, getWarrantyById, getExpiringWarranties, getWarrantyStats } from './services/warranty-service';

/**
 * Utility function to get the auth token from localStorage or Supabase session
 */
const getAuthToken = async (): Promise<string | undefined> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return undefined; // Server-side, no token available
    }

    // Try to get token from localStorage first for backward compatibility
    const localToken = localStorage.getItem('authToken');
    if (localToken) {
      return localToken;
    }
    
    // Try to get token from Supabase session
    try {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token;
    } catch (sessionError) {
      console.warn('Session retrieval error:', sessionError);
      // Continue execution even if session retrieval fails
      return undefined;
    }
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
};

// Base URL for API requests
const API_BASE_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_API_URL || 'https://api.warrity.com'
  : process.env.NEXT_PUBLIC_API_URL || 'https://api.warrity.com';

// If the API_URL is not set, use the APP_URL or default to production URL
export const APP_URL = typeof window !== 'undefined'
  ? process.env.NEXT_PUBLIC_APP_URL || 'https://warrity.com'
  : process.env.NEXT_PUBLIC_APP_URL || 'https://warrity.com';

// Check if we should use direct Supabase queries instead of API
// This is a workaround for CORS issues
const USE_DIRECT_SUPABASE = true;

/**
 * Utility function to make GET requests using Supabase
 * @param path - The API path to request
 * @param params - Query parameters to include in the request
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function supabaseGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Filter out undefined values from params
    const queryParams = params 
      ? Object.entries(params).reduce((acc, [key, value]) => {
          if (value !== undefined) {
            acc[key] = String(value);
          }
          return acc;
        }, {} as Record<string, string>)
      : {};
    
    // For supabase data queries
    if (path.startsWith('/')) {
      path = path.substring(1); // Remove the leading slash for Supabase paths
    }
    
    // Handle direct Supabase queries for specific endpoints
    if (USE_DIRECT_SUPABASE) {
      // Handle warranty-related endpoints
      if (path === 'warranties' || path.startsWith('warranties/')) {
        return await handleWarrantyEndpoints<T>(path, queryParams, options);
      }
      
      // Handle profiles endpoints
      if (path === 'profiles' || path.startsWith('profiles/')) {
        return await handleProfileEndpoints<T>(path, queryParams, options);
      }
      
      // Handle products endpoints
      if (path === 'products' || path.startsWith('products/')) {
        return await handleProductEndpoints<T>(path, queryParams, options);
      }
    }
    
    // Handle different types of requests
    if (path.includes('table/')) {
      // This is a direct table query
      const tableName = path.replace('table/', '');
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as T;
    } else {
      // This is an external API request or a custom function call
      const token = await getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // If this is a Supabase function
      if (path.startsWith('functions/')) {
        const functionName = path.replace('functions/', '');
        const { data, error } = await supabase.functions.invoke(functionName, {
          body: queryParams
        });
        
        if (error) throw error;
        return data as T;
      } else {
        // External API request - use the configured API URL
        const response = await fetch(`${API_BASE_URL}/${path}${
          Object.keys(queryParams).length > 0 
            ? `?${new URLSearchParams(queryParams as Record<string, string>).toString()}` 
            : ''
        }`, {
          method: 'GET',
          headers,
          ...options
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json() as T;
      }
    }
  } catch (error) {
    console.error(`Error making GET request to ${path}:`, error);
    throw error;
  }
}

/**
 * Handle warranty-related endpoints directly with Supabase
 */
async function handleWarrantyEndpoints<T>(
  path: string,
  params: Record<string, string> = {},
  options?: Record<string, any>
): Promise<T> {
  // Extract ID if it's in the path
  const pathParts = path.split('/');
  const isDetailPath = pathParts.length > 1;
  const warrantyId = isDetailPath ? pathParts[1] : null;
  
  // Handle different endpoints
  if (path === 'warranties') {
    // Get all warranties using service with fallback
    try {
      const warranties = await getAllWarranties();
      console.log('Retrieved warranties from service:', warranties.length);
      
      return { 
        warranties,
        // Add pagination info if needed
        pagination: {
          total: warranties.length,
          page: 1,
          limit: warranties.length,
          totalPages: 1
        }
      } as unknown as T;
    } catch (error) {
      console.error('Error in handleWarrantyEndpoints for warranties list:', error);
      // Return empty array as fallback
      return { 
        warranties: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0
        }
      } as unknown as T;
    }
  } else if (warrantyId && pathParts.length === 2) {
    // Get warranty by ID using service with fallback
    try {
      const warranty = await getWarrantyById(warrantyId);
      
      if (!warranty) {
        throw new Error(`Warranty with ID ${warrantyId} not found`);
      }
      
      return { warranty } as unknown as T;
    } catch (error) {
      console.error(`Error in handleWarrantyEndpoints for warranty ID ${warrantyId}:`, error);
      // Return null as fallback
      return { warranty: null } as unknown as T;
    }
  } else if (path === 'warranties/expiring') {
    // Get expiring warranties using service with fallback
    try {
      const warranties = await getExpiringWarranties(30);
      
      return { warranties } as unknown as T;
    } catch (error) {
      console.error('Error in handleWarrantyEndpoints for expiring warranties:', error);
      // Return empty array as fallback
      return { warranties: [] } as unknown as T;
    }
  } else if (path === 'warranties/stats/overview') {
    // Get warranty stats using service with fallback
    try {
      const stats = await getWarrantyStats();
      const warranties = await getAllWarranties();
      
      return {
        ...stats,
        warrantyByCategory: [],
        recentWarranties: warranties.slice(0, 5)
      } as unknown as T;
    } catch (error) {
      console.error('Error in handleWarrantyEndpoints for warranty stats:', error);
      // Return empty stats as fallback
      return {
        total: 0,
        active: 0,
        expiring: 0,
        expired: 0,
        warrantyByCategory: [],
        recentWarranties: []
      } as unknown as T;
    }
  }
  
  // If not a handled endpoint, throw error
  throw new Error(`Warranty endpoint not implemented: ${path}`);
}

/**
 * Handle profile-related endpoints directly with Supabase
 */
async function handleProfileEndpoints<T>(
  path: string,
  params: Record<string, string> = {},
  options?: Record<string, any>
): Promise<T> {
  // Handle various profile endpoints here as needed
  if (path === 'profiles') {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) throw error;
    return data as unknown as T;
  }
  
  // Add more profile-related handlers as needed
  
  // If not a handled endpoint, throw error
  throw new Error(`Profile endpoint not implemented: ${path}`);
}

/**
 * Handle product-related endpoints directly with Supabase
 */
async function handleProductEndpoints<T>(
  path: string,
  params: Record<string, string> = {},
  options?: Record<string, any>
): Promise<T> {
  // Extract ID if it's in the path
  const pathParts = path.split('/');
  const isDetailPath = pathParts.length > 1;
  const productId = isDetailPath ? pathParts[1] : null;
  
  // Handle different endpoints
  if (path === 'products') {
    // Get all products
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Map to format expected by frontend
    const productsWithCompatibleIds = data.map(product => ({
      _id: product.id,
      ...product
    }));
    
    return { 
      products: productsWithCompatibleIds,
      // Add pagination info if needed
      pagination: {
        total: data.length,
        page: 1,
        limit: data.length,
        totalPages: 1
      }
    } as unknown as T;
  } else if (productId && pathParts.length === 2) {
    // Get product by ID
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) throw error;
    
    // Map to format expected by frontend
    const productWithCompatibleId = {
      _id: data.id,
      ...data
    };
    
    return { product: productWithCompatibleId } as unknown as T;
  } else if (path === 'products/stats') {
    // Get product stats 
    const { data: products, error } = await supabase
      .from('products')
      .select('*');
    
    if (error) throw error;
    
    return {
      total: products.length,
      byCategory: Object.entries(
        products.reduce((acc, product) => {
          const category = product.category || 'Uncategorized';
          acc[category] = (acc[category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([category, count]) => ({
        category,
        count
      })),
      byManufacturer: Object.entries(
        products.reduce((acc, product) => {
          const manufacturer = product.manufacturer || 'Unknown';
          acc[manufacturer] = (acc[manufacturer] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([manufacturer, count]) => ({
        manufacturer,
        count
      })),
      recentProducts: products
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 5)
        .map(product => ({
          _id: product.id,
          ...product
        }))
    } as unknown as T;
  }
  
  // If not a handled endpoint, throw error
  throw new Error(`Product endpoint not implemented: ${path}`);
}

/**
 * Utility function to make POST requests using Supabase
 * @param path - The API path to request
 * @param data - The request body
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function supabasePost<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  try {
    // For supabase data queries
    if (path.startsWith('/')) {
      path = path.substring(1); // Remove the leading slash for Supabase paths
    }
    
    // Handle different types of requests
    if (path.includes('table/')) {
      // This is a direct table insert
      const tableName = path.replace('table/', '');
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select();
      
      if (error) throw error;
      return result as unknown as T;
    } else {
      // This is an external API request or a custom function call
      const token = await getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // If this is a Supabase function
      if (path.startsWith('functions/')) {
        const functionName = path.replace('functions/', '');
        const { data: result, error } = await supabase.functions.invoke(functionName, {
          body: data
        });
        
        if (error) throw error;
        return result as T;
      } else {
        // External API request - use the configured API URL
        const response = await fetch(`${API_BASE_URL}/${path}`, {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
          ...options
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        return await response.json() as T;
      }
    }
  } catch (error) {
    console.error(`Error making POST request to ${path}:`, error);
    throw error;
  }
}

/**
 * Utility function to make PUT requests using Supabase
 * @param path - The API path to request
 * @param data - The request body
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function supabasePut<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  try {
    // For supabase data queries
    if (path.startsWith('/')) {
      path = path.substring(1); // Remove the leading slash for Supabase paths
    }
    
    // Handle different types of requests
    if (path.includes('table/')) {
      // This is a direct table update
      const tableParts = path.replace('table/', '').split('/');
      const tableName = tableParts[0];
      const id = tableParts[1]; // Assuming ID is in the path
      
      if (!id) {
        throw new Error('ID is required for PUT operations on tables');
      }
      
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result as unknown as T;
    } else {
      // This is an external API request or a custom function call
      const token = await getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // External API request - use the configured API URL
      const response = await fetch(`${API_BASE_URL}/${path}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      return await response.json() as T;
    }
  } catch (error) {
    console.error(`Error making PUT request to ${path}:`, error);
    throw error;
  }
}

/**
 * Utility function to make DELETE requests using Supabase
 * @param path - The API path to request
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function supabaseDelete<T>(
  path: string,
  options?: Record<string, any>
): Promise<T> {
  try {
    // For supabase data queries
    if (path.startsWith('/')) {
      path = path.substring(1); // Remove the leading slash for Supabase paths
    }
    
    // Handle different types of requests
    if (path.includes('table/')) {
      // This is a direct table delete
      const tableParts = path.replace('table/', '').split('/');
      const tableName = tableParts[0];
      const id = tableParts[1]; // Assuming ID is in the path
      
      if (!id) {
        throw new Error('ID is required for DELETE operations on tables');
      }
      
      const { data: result, error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return result as unknown as T;
    } else {
      // This is an external API request or a custom function call
      const token = await getAuthToken();
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };
      
      // External API request - use the configured API URL
      const response = await fetch(`${API_BASE_URL}/${path}`, {
        method: 'DELETE',
        headers,
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
      }
      
      try {
        return await response.json() as T;
      } catch {
        // If the response is not JSON, return an empty object
        return {} as T;
      }
    }
  } catch (error) {
    console.error(`Error making DELETE request to ${path}:`, error);
    throw error;
  }
} 