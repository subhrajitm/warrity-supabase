import { get, post, put, del } from 'aws-amplify/api';

/**
 * Utility function to get the auth token from localStorage
 * (temporary solution until AWS Amplify Auth is set up)
 */
const getAuthToken = (): string | undefined => {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem('authToken') || undefined : undefined;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return undefined;
  }
};

/**
 * Utility function to make GET requests using AWS Amplify API
 * @param path - The API path to request
 * @param params - Query parameters to include in the request
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function amplifyGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: Record<string, any>
): Promise<T> {
  try {
    const queryParams = params ? 
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .reduce((acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        }, {} as Record<string, string>) 
      : undefined;
    
    // Get auth token
    const token = getAuthToken();
    
    const restOperation = get({
      apiName: 'warrity-api',
      path,
      options: {
        headers: {
          ...(options?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        queryParams
      }
    });
    
    const response = await restOperation.response;
    const result = await response.body.json();
    return result as T;
  } catch (error) {
    console.error(`Error making GET request to ${path}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { statusCode: number, body: string } };
      console.error('API error:', apiError.response.statusCode, apiError.response.body);
    }
    throw error;
  }
}

/**
 * Utility function to make POST requests using AWS Amplify API
 * @param path - The API path to request
 * @param data - The request body
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function amplifyPost<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Get auth token
    const token = getAuthToken();
    
    const restOperation = post({
      apiName: 'warrity-api',
      path,
      options: {
        body: data,
        headers: {
          ...(options?.headers || {}),
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    });
    
    const response = await restOperation.response;
    const result = await response.body.json();
    return result as T;
  } catch (error) {
    console.error(`Error making POST request to ${path}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { statusCode: number, body: string } };
      console.error('API error:', apiError.response.statusCode, apiError.response.body);
    }
    throw error;
  }
}

/**
 * Utility function to make PUT requests using AWS Amplify API
 * @param path - The API path to request
 * @param data - The request body
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function amplifyPut<T>(
  path: string,
  data?: Record<string, any>,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Get auth token
    const token = getAuthToken();
    
    const restOperation = put({
      apiName: 'warrity-api',
      path,
      options: {
        body: data,
        headers: {
          ...(options?.headers || {}),
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    });
    
    const response = await restOperation.response;
    const result = await response.body.json();
    return result as T;
  } catch (error) {
    console.error(`Error making PUT request to ${path}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { statusCode: number, body: string } };
      console.error('API error:', apiError.response.statusCode, apiError.response.body);
    }
    throw error;
  }
}

/**
 * Utility function to make DELETE requests using AWS Amplify API
 * @param path - The API path to request
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function amplifyDelete<T>(
  path: string,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Get auth token
    const token = getAuthToken();
    
    const restOperation = del({
      apiName: 'warrity-api',
      path,
      options: {
        headers: {
          ...(options?.headers || {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    });
    
    // Handle the response
    const response = await restOperation.response;
    try {
      // Try to parse as JSON
      const result = await response.body.json();
      return result as T;
    } catch (jsonError) {
      // If not JSON, return empty object
      return {} as T;
    }
  } catch (error) {
    console.error(`Error making DELETE request to ${path}:`, error);
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { statusCode: number, body: string } };
      console.error('API error:', apiError.response.statusCode, apiError.response.body);
    }
    throw error;
  }
} 