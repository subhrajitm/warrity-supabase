import { fetchAuthSession } from 'aws-amplify/auth';
import { get, post, put, del } from 'aws-amplify/api';

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
      `?${Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&')}` 
      : '';
    
    // Get auth session for authenticated requests if needed
    const { accessToken } = (await fetchAuthSession()).tokens ?? {};
    
    const result = await get({
      apiName: 'warrity-api',
      path: `${path}${queryParams}`,
      options: {
        ...options,
        headers: {
          ...(options?.headers || {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      }
    });
    
    return result.body as T;
  } catch (error) {
    console.error(`Error making GET request to ${path}:`, error);
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
export async function amplifyPost<T, D = any>(
  path: string,
  data?: D,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Get auth session for authenticated requests if needed
    const { accessToken } = (await fetchAuthSession()).tokens ?? {};
    
    const result = await post({
      apiName: 'warrity-api',
      path,
      options: {
        ...options,
        body: data,
        headers: {
          ...(options?.headers || {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      }
    });
    
    return result.body as T;
  } catch (error) {
    console.error(`Error making POST request to ${path}:`, error);
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
export async function amplifyPut<T, D = any>(
  path: string,
  data?: D,
  options?: Record<string, any>
): Promise<T> {
  try {
    // Get auth session for authenticated requests if needed
    const { accessToken } = (await fetchAuthSession()).tokens ?? {};
    
    const result = await put({
      apiName: 'warrity-api',
      path,
      options: {
        ...options,
        body: data,
        headers: {
          ...(options?.headers || {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      }
    });
    
    return result.body as T;
  } catch (error) {
    console.error(`Error making PUT request to ${path}:`, error);
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
    // Get auth session for authenticated requests if needed
    const { accessToken } = (await fetchAuthSession()).tokens ?? {};
    
    const result = await del({
      apiName: 'warrity-api',
      path,
      options: {
        ...options,
        headers: {
          ...(options?.headers || {}),
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        }
      }
    });
    
    return result.body as T;
  } catch (error) {
    console.error(`Error making DELETE request to ${path}:`, error);
    throw error;
  }
} 