/**
 * This file provides backward compatibility for code that imports from 'amplify-api.ts'
 * but now uses Supabase instead of AWS Amplify
 */

import { supabaseGet, supabasePost, supabasePut, supabaseDelete } from './supabase-api';

/**
 * Utility function to make GET requests (previously using AWS Amplify, now using Supabase)
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
    return await supabaseGet<T>(path, params, options);
  } catch (error) {
    console.error(`Error making GET request to ${path}:`, error);
    throw error;
  }
}

/**
 * Utility function to make POST requests (previously using AWS Amplify, now using Supabase)
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
    return await supabasePost<T>(path, data, options);
  } catch (error) {
    console.error(`Error making POST request to ${path}:`, error);
    throw error;
  }
}

/**
 * Utility function to make PUT requests (previously using AWS Amplify, now using Supabase)
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
    return await supabasePut<T>(path, data, options);
  } catch (error) {
    console.error(`Error making PUT request to ${path}:`, error);
    throw error;
  }
}

/**
 * Utility function to make DELETE requests (previously using AWS Amplify, now using Supabase)
 * @param path - The API path to request
 * @param options - Additional request options
 * @returns Promise with the API response
 */
export async function amplifyDelete<T>(
  path: string,
  options?: Record<string, any>
): Promise<T> {
  try {
    return await supabaseDelete<T>(path, options);
  } catch (error) {
    console.error(`Error making DELETE request to ${path}:`, error);
    throw error;
  }
} 