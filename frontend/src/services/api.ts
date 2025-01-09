// src/services/api.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { getAuthToken, setAuthToken } from '../utils/tokenStorage';
import { store } from '../store';
import { logout } from '../store/actions/authActions';
import { trackEvent } from '../utils/analytics';

class ApiService {
  private static instance: ApiService;
  private api: AxiosInstance;
  private baseURL: string;

  private constructor() {
    this.baseURL = process.env.REACT_APP_API_BASE_URL || 'https://api.example.com';
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config: AxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await this.api.post('/auth/refresh', { refreshToken });
            const { token } = response.data;
            setAuthToken(token);
            return this.api(originalRequest);
          } catch (refreshError) {
            store.dispatch(logout());
            message.error('Session expired. Please login again.');
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.get<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'GET', url);
      throw error;
    }
  }

  public async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'POST', url);
      throw error;
    }
  }

  public async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'PUT', url);
      throw error;
    }
  }

  public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.delete<T>(url, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'DELETE', url);
      throw error;
    }
  }

  public async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.api.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError, 'PATCH', url);
      throw error;
    }
  }

  private handleError(error: AxiosError, method: string, url: string): void {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.message || error.message;

    console.error(`API Error: ${method} ${url} - Status: ${status} - Message: ${errorMessage}`);

    switch (status) {
      case 400:
        message.error('Bad request. Please check your input.');
        break;
      case 401:
        message.error('Unauthorized. Please login again.');
        break;
      case 403:
        message.error('Forbidden. You do not have permission to access this resource.');
        break;
      case 404:
        message.error('Resource not found.');
        break;
      case 500:
        message.error('Internal server error. Please try again later.');
        break;
      default:
        message.error('An unexpected error occurred. Please try again.');
    }

    trackEvent('API Error', {
      method,
      url,
      status,
      errorMessage,
    });
  }

  // Advanced features
  public setBaseUrl(url: string): void {
    this.baseURL = url;
    this.api.defaults.baseURL = url;
  }

  public setDefaultHeader(key: string, value: string): void {
    this.api.defaults.headers.common[key] = value;
  }

  public async uploadFile(url: string, file: File, onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  public cancelRequest(cancelToken: axios.CancelToken): void {
    cancelToken.cancel('Request canceled by the user.');
  }

  public getCancelToken(): axios.CancelTokenSource {
    return axios.CancelToken.source();
  }
}

export const apiService = ApiService.getInstance();
