import { QueryClient, QueryFunction } from "@tanstack/react-query";

/**
 * CACHE BUSTING STRATEGY
 * 
 * To prevent stale data issues in the application, we employ several techniques:
 * 
 * 1. All GET requests automatically have a timestamp-based cache buster (_cb) parameter added
 * 2. Cache-Control and Pragma headers are set to prevent browser caching
 * 3. The Leaderboard component also implements its own refreshLeaderboard function with cache busting
 * 4. Admin operations clear the queryClient cache after data modifications
 * 5. Server-side cache headers are also set on sensitive endpoints
 * 
 * This multi-layered approach ensures users always see fresh data, especially after
 * database resets or recalculations.
 */

// Get the API base URL from environment variables, defaults to current origin in development
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Helper to determine if a path should use the external API or local API
function getFullApiUrl(path: string): string {
  // If the path is already a full URL, return it as is
  if (path.startsWith('http')) {
    return path;
  }
  
  // If we have an API base URL and the path starts with '/api', use the external API
  if (API_BASE_URL && path.startsWith('/api')) {
    // Remove trailing slash from API_BASE_URL if it exists
    const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const fullUrl = `${baseUrl}${path}`;
    console.log(`API Request: Using full API URL: ${fullUrl} (base: ${API_BASE_URL})`);
    return fullUrl;
  }
  
  // For development, use the local relative path
  console.log(`API Request: Using local path: ${path}`);
  return path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/**
 * Improved apiRequest function with retry logic for better resilience 
 * against temporary network issues and connection problems
 */
export async function apiRequest<T = any>(
  urlOrPathOrMethod: string,
  urlOrPathOrData?: string | unknown | undefined,
  data?: unknown | undefined,
  retryCount: number = 2, // Default to 2 retries (3 total attempts)
): Promise<T> {
  // Maximum retries to prevent infinite loops
  const MAX_RETRIES = 3;
  const actualRetryCount = Math.min(retryCount, MAX_RETRIES);
  
  // Function to delay execution for a given time
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
  // Try the request with retry logic
  for (let attempt = 0; attempt <= actualRetryCount; attempt++) {
    try {
      // If the first argument starts with a slash or http, assume it's a GET request
      if (urlOrPathOrMethod.startsWith('/') || urlOrPathOrMethod.startsWith('http')) {
        const url = getFullApiUrl(urlOrPathOrMethod);
        console.log(`API Request: GET ${url}`);
        
        // Add a timestamp cache buster to the URL if it doesn't already have one
        const urlWithCacheBuster = url.includes('_cb=') 
          ? url 
          : `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`;
        
        // Determine if we're in a Netlify environment to modify headers accordingly
        const isNetlify = typeof window !== 'undefined' && 
                        window.location.hostname.includes('netlify.app');
        
        console.log(`Environment detection: ${isNetlify ? 'Netlify detected' : 'Not running on Netlify'}`);
        
        const res = await fetch(urlWithCacheBuster, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            // Only include Pragma header for non-Netlify environments (causes CORS issues on Netlify)
            ...(!isNetlify && { 'Pragma': 'no-cache' })
          },
        });
        
        await throwIfResNotOk(res);
        const jsonData = await res.json();
        console.log(`API Response: GET ${url} - Status: ${res.status}`);
        return jsonData as T;
      }
      
      // Otherwise, assume it's a method and the second argument is the URL
      const method = urlOrPathOrMethod;
      const url = getFullApiUrl(urlOrPathOrData as string);
      const requestData = data;
      
      console.log(`API Request: ${method} ${url}`);
      
      // Add a timestamp cache buster to the URL for non-POST requests
      // For POST, we don't need a cache buster since they shouldn't be cached anyway
      const urlWithCacheBuster = (method !== 'POST' && !url.includes('_cb='))
        ? `${url}${url.includes('?') ? '&' : '?'}_cb=${Date.now()}`
        : url;
      
      // Determine if we're in a Netlify environment to modify headers accordingly
      const isNetlify = typeof window !== 'undefined' && 
                      window.location.hostname.includes('netlify.app');
      
      console.log(`Environment detection: ${isNetlify ? 'Netlify detected' : 'Not running on Netlify'}`);
        
      const res = await fetch(urlWithCacheBuster, {
        method,
        headers: {
          ...(requestData ? { "Content-Type": "application/json" } : {}),
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          // Only include Pragma header for non-Netlify environments (causes CORS issues on Netlify)
          ...(!isNetlify && { 'Pragma': 'no-cache' })
        },
        body: requestData ? JSON.stringify(requestData) : undefined,
        credentials: "include",
      });
    
      await throwIfResNotOk(res);
      const jsonData = await res.json();
      console.log(`API Response: ${method} ${url} - Status: ${res.status}`);
      return jsonData as T;
    } catch (error) {
      // Last attempt - throw the error
      if (attempt === actualRetryCount) {
        console.error('API Request failed after all retry attempts:', error);
        throw error;
      }
      
      // Not the last attempt - retry after exponential backoff delay
      const backoffTime = Math.min(1000 * Math.pow(2, attempt), 8000);
      console.warn(`API request attempt ${attempt + 1} failed, retrying in ${backoffTime/1000}s...`, error);
      await delay(backoffTime);
    }
  }
  
  // This should never be reached due to the throw in the catch block
  throw new Error('Unexpected API request failure');
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const path = queryKey[0] as string;
      // Use our improved apiRequest function instead of direct fetch
      // to ensure proper URL resolution and error handling
      console.log(`Query operation for key: ${JSON.stringify(queryKey)}`);
      
      // Just use the first element of the query key as the path
      const result = await apiRequest(path);
      
      return result;
    } catch (error) {
      console.error(`Query failed for key: ${JSON.stringify(queryKey)}`, error);
      
      // Handle 401 Unauthorized based on the specified behavior
      if (error instanceof Error && 
          error.message.startsWith('401:') && 
          unauthorizedBehavior === "returnNull") {
        return null;
      }
      
      // Re-throw all other errors
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
