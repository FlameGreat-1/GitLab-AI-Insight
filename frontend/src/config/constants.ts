// src/config/constants.ts

// Define custom types for Analytics
type AnalyticsTimeRange = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'LAST_90_DAYS' | 'LAST_12_MONTHS' | 'ALL_TIME';
type AnalyticsMetric = 'COMMITS' | 'ISSUES' | 'MERGE_REQUESTS' | 'CODE_CHANGES';

// Use process.env with type assertion for React environment variables
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
export const WEBSOCKET_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3000';

export const API_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REFRESH_TOKEN: '/auth/refresh-token',
  NETWORK_ANALYSIS: '/analytics/network',
  TIME_SERIES: '/analytics/time-series',
  CONTRIBUTOR_STATS: '/analytics/contributor-stats',
  PROJECT_STATS: '/analytics/project-stats',
} as const;

export const LOCAL_STORAGE_KEYS = {
  AUTH_TOKEN: 'gitlab_insight_auth_token',
  REFRESH_TOKEN: 'gitlab_insight_refresh_token',
  USER_PREFERENCES: 'gitlab_insight_user_preferences',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE_SIZE: 20,
  INITIAL_PAGE: 1,
} as const;

export const CHART_COLORS = [
  '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
  '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
] as const;

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const ANALYTICS_TIME_RANGES: { [key: string]: { label: string, value: AnalyticsTimeRange } } = {
  LAST_7_DAYS: { label: 'Last 7 Days', value: 'LAST_7_DAYS' },
  LAST_30_DAYS: { label: 'Last 30 Days', value: 'LAST_30_DAYS' },
  LAST_90_DAYS: { label: 'Last 90 Days', value: 'LAST_90_DAYS' },
  LAST_12_MONTHS: { label: 'Last 12 Months', value: 'LAST_12_MONTHS' },
  ALL_TIME: { label: 'All Time', value: 'ALL_TIME' },
} as const;

export const ANALYTICS_METRICS: { [key: string]: { label: string, value: AnalyticsMetric } } = {
  COMMITS: { label: 'Commits', value: 'COMMITS' },
  ISSUES: { label: 'Issues', value: 'ISSUES' },
  MERGE_REQUESTS: { label: 'Merge Requests', value: 'MERGE_REQUESTS' },
  CODE_CHANGES: { label: 'Code Changes', value: 'CODE_CHANGES' },
} as const;

export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // in milliseconds

export const DEBOUNCE_DELAY = 300; // in milliseconds

export const MOBILE_BREAKPOINT = 768; // in pixels
