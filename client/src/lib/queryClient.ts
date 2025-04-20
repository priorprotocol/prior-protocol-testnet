import { QueryClient, QueryFunction } from "@tanstack/react-query";

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

export async function apiRequest<T = any>(
  urlOrPathOrMethod: string,
  urlOrPathOrData?: string | unknown | undefined,
  data?: unknown | undefined,
): Promise<T> {
  try {
    // If the first argument starts with a slash or http, assume it's a GET request
    if (urlOrPathOrMethod.startsWith('/') || urlOrPathOrMethod.startsWith('http')) {
      const url = getFullApiUrl(urlOrPathOrMethod);
      console.log(`API Request: GET ${url}`);
      
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
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
    
    const res = await fetch(url, {
      method,
      headers: {
        ...(requestData ? { "Content-Type": "application/json" } : {}),
        'Accept': 'application/json'
      },
      body: requestData ? JSON.stringify(requestData) : undefined,
      credentials: "include",
    });
  
    await throwIfResNotOk(res);
    const jsonData = await res.json();
    console.log(`API Response: ${method} ${url} - Status: ${res.status}`);
    return jsonData as T;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
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
