import axios, { type AxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export async function request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
  try {
    const response = await api.request<ApiResponse<T>>(config);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.data) {
      return error.response.data as ApiResponse<T>;
    }
    return {
      success: false,
      error: '网络请求失败，请稍后重试',
    };
  }
}

export default api;
