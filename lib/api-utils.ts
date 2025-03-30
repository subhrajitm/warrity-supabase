// API Response Types
export interface ApiResponse<T> {
  data?: T;
  events?: T;
  products?: T;
  error?: string;
  message?: string;
}

// API Configuration
export const apiConfig = {
  baseUrl: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
};

// Error handling utility
export const handleApiError = async (response: Response): Promise<string> => {
  const clonedResponse = response.clone();
  try {
    const responseText = await clonedResponse.text();
    if (responseText) {
      // Check if the response is HTML (common with 404 errors)
      if (responseText.trim().startsWith('<!DOCTYPE html>') || 
          responseText.trim().startsWith('<html')) {
        return `API endpoint not found. Status: ${response.status} ${response.statusText}`;
      }
      
      try {
        const errorData = JSON.parse(responseText);
        return errorData.message || errorData.error || 'Operation failed';
      } catch {
        return responseText;
      }
    }
    return response.statusText || 'Operation failed';
  } catch {
    return response.statusText || 'Operation failed';
  }
};

// Fetch with retry logic
export const fetchWithRetry = async (
  url: string, 
  options: RequestInit, 
  retries = 3
): Promise<Response> => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempt ${i+1} - Fetching ${url}`);
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Handle 401 unauthorized
      if (response.status === 401) {
        throw new Error('Unauthorized');
      }
      
      // Handle 404 not found
      if (response.status === 404) {
        const errorMessage = await handleApiError(response);
        // If we're hitting a 404 for an API endpoint, try to use Supabase directly
        if (url.includes('/api/')) {
          throw new Error(`API endpoint not found: ${url}`);
        }
        throw new Error(errorMessage);
      }
      
      // For other errors, try to get error message
      const errorMessage = await handleApiError(response);
      throw new Error(errorMessage);
    } catch (error) {
      if (i === retries - 1) throw error;
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw new Error('Max retries reached');
};

// Fetch with cache
export class ApiCache {
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async fetchWithCache<T>(
    url: string, 
    options: RequestInit
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetchWithRetry(url, options);
      
      // Check if response is HTML before trying to parse as JSON
      const clonedResponse = response.clone();
      const text = await clonedResponse.text();
      
      if (text.trim().startsWith('<!DOCTYPE html>') || 
          text.trim().startsWith('<html')) {
        // This is an HTML response, not JSON
        throw new Error(`Received HTML instead of JSON from ${url}. The API endpoint may not exist.`);
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Failed to parse JSON response from ${url}: ${text.substring(0, 100)}...`);
      }
      
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      return data;
    } catch (error) {
      console.error(`Error fetching from ${url}:`, error);
      
      // For API errors with missing endpoints, use fallback data if available
      if (url.includes('/api/events') && error instanceof Error && 
          (error.message.includes('not found') || error.message.includes('HTML'))) {
        console.log('Using fallback for events API');
        // Return empty events array as fallback
        return { events: [] } as unknown as T;
      }
      
      if (url.includes('/api/products') && error instanceof Error && 
          (error.message.includes('not found') || error.message.includes('HTML'))) {
        console.log('Using fallback for products API');
        // Return empty products array as fallback
        return { products: [] } as unknown as T;
      }
      
      throw error;
    }
  }

  static clearCache() {
    this.cache.clear();
  }

  static removeFromCache(url: string) {
    for (const [key] of this.cache) {
      if (key.startsWith(url)) {
        this.cache.delete(key);
      }
    }
  }
}

// API request builder
export const createApiRequest = (
  endpoint: string,
  method: string = 'GET',
  body?: any
): RequestInit => {
  // Only try to access localStorage in browser environment
  let token = '';
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('authToken') || '';
  }
  
  return {
    method,
    headers: {
      ...apiConfig.headers,
      'Authorization': token ? `Bearer ${token}` : '',
    },
    ...(body && { body: JSON.stringify(body) }),
  };
};

// API endpoints
export const apiEndpoints = {
  events: {
    list: '/api/events',
    detail: (id: string) => `/api/events/${id}`,
  },
  products: {
    list: '/api/products',
  },
}; 