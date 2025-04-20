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
    return `${API_BASE_URL}${path}`;
  }
  
  // Otherwise, use the path as is (for local development or non-API paths)
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
  // If the first argument starts with a slash or http, assume it's a GET request
  if (urlOrPathOrMethod.startsWith('/') || urlOrPathOrMethod.startsWith('http')) {
    const url = getFullApiUrl(urlOrPathOrMethod);
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });
    
    await throwIfResNotOk(res);
    return res.json() as Promise<T>;
  }
  
  // Otherwise, assume it's a method and the second argument is the URL
  const method = urlOrPathOrMethod;
  const url = getFullApiUrl(urlOrPathOrData as string);
  const requestData = data;
  
  const res = await fetch(url, {
    method,
    headers: requestData ? { "Content-Type": "application/json" } : {},
    body: requestData ? JSON.stringify(requestData) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json() as Promise<T>;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = getFullApiUrl(queryKey[0] as string);
    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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
