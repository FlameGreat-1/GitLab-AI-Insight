// src/types/user.ts

export interface User {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    avatar: string;
    role: UserRole;
    permissions: Permission[];
    createdAt: string;
    updatedAt: string;
    lastLogin: string;
    isActive: boolean;
    twoFactorEnabled: boolean;
  }
  
  export type UserRole = 'ADMIN' | 'MANAGER' | 'DEVELOPER' | 'ANALYST' | 'VIEWER';
  
  export type Permission = 
    | 'CREATE_PROJECT'
    | 'DELETE_PROJECT'
    | 'MODIFY_PROJECT'
    | 'VIEW_PROJECT'
    | 'CREATE_MODEL'
    | 'DELETE_MODEL'
    | 'MODIFY_MODEL'
    | 'VIEW_MODEL'
    | 'RUN_PREDICTION'
    | 'VIEW_ANALYTICS'
    | 'MANAGE_USERS'
    | 'MANAGE_ROLES';
  
  export interface UserPreferences {
    theme: 'light' | 'dark';
    language: string;
    timezone: string;
    notificationSettings: NotificationSettings;
    dashboardLayout: DashboardWidgetConfig[];
  }
  
  export interface NotificationSettings {
    email: boolean;
    push: boolean;
    slack: boolean;
    frequency: 'REAL_TIME' | 'DAILY' | 'WEEKLY';
    types: NotificationType[];
  }
  
  export type NotificationType = 
    | 'MODEL_TRAINING_COMPLETE'
    | 'PREDICTION_ALERT'
    | 'SYSTEM_UPDATE'
    | 'SECURITY_ALERT';
  
  export interface DashboardWidgetConfig {
    id: string;
    type: 'CHART' | 'TABLE' | 'METRIC' | 'ALERT';
    position: { x: number; y: number; w: number; h: number };
    settings: Record<string, any>;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegistrationData extends LoginCredentials {
    username: string;
    firstName: string;
    lastName: string;
  }
  
  export interface PasswordResetRequest {
    email: string;
  }
  
  export interface PasswordResetConfirmation {
    token: string;
    newPassword: string;
  }
  
  export interface UserActivity {
    id: string;
    userId: string;
    action: UserActionType;
    details: Record<string, any>;
    timestamp: string;
    ipAddress: string;
    userAgent: string;
  }
  
  export type UserActionType = 
    | 'LOGIN'
    | 'LOGOUT'
    | 'PASSWORD_CHANGE'
    | 'PROFILE_UPDATE'
    | 'MODEL_CREATE'
    | 'MODEL_UPDATE'
    | 'MODEL_DELETE'
    | 'PREDICTION_RUN'
    | 'DATASET_UPLOAD'
    | 'EXPERIMENT_START'
    | 'DEPLOYMENT_CREATE';
  
  export interface UserStats {
    totalProjects: number;
    totalModels: number;
    totalPredictions: number;
    lastActivityDate: string;
    mostUsedModelId: string;
    averagePredictionAccuracy: number;
  }
  
  export interface ApiError {
    message: string;
    code: string;
    details?: Record<string, any>;
  }
  