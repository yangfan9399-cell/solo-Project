import type { ApiResponse } from '~/types';

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    
    if (!response.ok) {
      return { success: false, message: `HTTP错误: ${response.status}` };
    }
    
    return await response.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '未知错误' };
  }
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(url: string) => request<T>(url, { method: 'DELETE' }),
};
