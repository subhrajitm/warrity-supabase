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
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      // Handle 401 unauthorized
      if (response.status === 401) {
        throw new Error('Unauthorized');
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

    const response = await fetchWithRetry(url, options);
    const data = await response.json();
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
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
  const token = localStorage.getItem('authToken');
  
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