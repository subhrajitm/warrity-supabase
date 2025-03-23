import supabase from './supabase-config';

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
        // External API request - use localhost API URL if in development
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : process.env.NEXT_PUBLIC_API_URL;
          
        const response = await fetch(`${apiUrl}/${path}${
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
        // External API request - use localhost API URL if in development
        const apiUrl = process.env.NODE_ENV === 'development' 
          ? 'http://localhost:3000' 
          : process.env.NEXT_PUBLIC_API_URL;
          
        const response = await fetch(`${apiUrl}/${path}`, {
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
      
      // External API request - use localhost API URL if in development
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.NEXT_PUBLIC_API_URL;
        
      const response = await fetch(`${apiUrl}/${path}`, {
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
      
      // External API request - use localhost API URL if in development
      const apiUrl = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:3000' 
        : process.env.NEXT_PUBLIC_API_URL;
        
      const response = await fetch(`${apiUrl}/${path}`, {
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