// src/config/endpoints.ts

const API_VERSION = 'v1';
const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://api.gitlabinsight.ai';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: `/api/${API_VERSION}/auth/login`,
    LOGOUT: `/api/${API_VERSION}/auth/logout`,
    REFRESH_TOKEN: `/api/${API_VERSION}/auth/refresh`,
    REGISTER: `/api/${API_VERSION}/auth/register`,
    FORGOT_PASSWORD: `/api/${API_VERSION}/auth/forgot-password`,
    RESET_PASSWORD: `/api/${API_VERSION}/auth/reset-password`,
  },
  USER: {
    PROFILE: `/api/${API_VERSION}/user/profile`,
    UPDATE_PROFILE: `/api/${API_VERSION}/user/profile`,
    CHANGE_PASSWORD: `/api/${API_VERSION}/user/change-password`,
    PREFERENCES: `/api/${API_VERSION}/user/preferences`,
  },
  PROJECTS: {
    LIST: `/api/${API_VERSION}/projects`,
    DETAILS: (id: string) => `/api/${API_VERSION}/projects/${id}`,
    CREATE: `/api/${API_VERSION}/projects`,
    UPDATE: (id: string) => `/api/${API_VERSION}/projects/${id}`,
    DELETE: (id: string) => `/api/${API_VERSION}/projects/${id}`,
  },
  ML_MODELS: {
    LIST: `/api/${API_VERSION}/ml/models`,
    DETAILS: (id: string) => `/api/${API_VERSION}/ml/models/${id}`,
    CREATE: `/api/${API_VERSION}/ml/models`,
    UPDATE: (id: string) => `/api/${API_VERSION}/ml/models/${id}`,
    DELETE: (id: string) => `/api/${API_VERSION}/ml/models/${id}`,
    TRAIN: (id: string) => `/api/${API_VERSION}/ml/models/${id}/train`,
    PREDICT: (id: string) => `/api/${API_VERSION}/ml/models/${id}/predict`,
  },
  DATASETS: {
    LIST: `/api/${API_VERSION}/datasets`,
    DETAILS: (id: string) => `/api/${API_VERSION}/datasets/${id}`,
    UPLOAD: `/api/${API_VERSION}/datasets/upload`,
    DELETE: (id: string) => `/api/${API_VERSION}/datasets/${id}`,
  },
  ANALYTICS: {
    OVERVIEW: `/api/${API_VERSION}/analytics/overview`,
    PROJECT_PERFORMANCE: (id: string) => `/api/${API_VERSION}/analytics/projects/${id}/performance`,
    MODEL_PERFORMANCE: (id: string) => `/api/${API_VERSION}/analytics/models/${id}/performance`,
    USER_ACTIVITY: `/api/${API_VERSION}/analytics/user-activity`,
  },
  NOTIFICATIONS: {
    LIST: `/api/${API_VERSION}/notifications`,
    MARK_READ: (id: string) => `/api/${API_VERSION}/notifications/${id}/read`,
    SETTINGS: `/api/${API_VERSION}/notifications/settings`,
  },
};

export const constructUrl = (endpoint: string, queryParams?: Record<string, string>): string => {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }
  return url.toString();
};

export default ENDPOINTS;
