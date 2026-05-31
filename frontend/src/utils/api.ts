import { API_BASE_URL } from '~/constants';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit & { server?: boolean }
): Promise<T> {
  const baseUrl = options?.server 
    ? 'http://localhost:8000/api'
    : API_BASE_URL;

  const url = endpoint.startsWith('/api')
    ? endpoint.replace('/api', baseUrl)
    : `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  return response.json();
}

export async function serverFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  return fetchApi<T>(endpoint, { ...options, server: true });
}
