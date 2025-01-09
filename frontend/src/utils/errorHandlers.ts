// src/utils/errorHandlers.ts

import { message, notification } from 'antd';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { trackEvent } from './analytics';

interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
}

class CustomError extends Error {
  constructor(public details: ErrorDetails) {
    super(details.message);
    this.name = 'CustomError';
  }
}

export class ErrorHandler {
  private static instance: ErrorHandler;

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  public handleError(error: Error | AxiosError | CustomError): void {
    console.error('Error occurred:', error);

    if (this.isAxiosError(error)) {
      this.handleAxiosError(error);
    } else if (error instanceof CustomError) {
      this.handleCustomError(error);
    } else {
      this.handleGenericError(error);
    }

    this.logError(error);
  }

  private isAxiosError(error: any): error is AxiosError {
    return error.isAxiosError === true;
  }

  private handleAxiosError(error: AxiosError): void {
    const status = error.response?.status;
    const data = error.response?.data as any;

    switch (status) {
      case 400:
        this.showErrorMessage(t('badRequestError'), data.message || t('invalidDataProvided'));
        break;
      case 401:
        this.showErrorMessage(t('unauthorizedError'), t('pleaseLoginAgain'));
        // Optionally, redirect to login page or refresh token
        break;
      case 403:
        this.showErrorMessage(t('forbiddenError'), t('noPermissionToAccess'));
        break;
      case 404:
        this.showErrorMessage(t('notFoundError'), t('resourceNotFound'));
        break;
      case 422:
        this.showValidationErrors(data.errors);
        break;
      case 500:
        this.showErrorMessage(t('serverError'), t('internalServerError'));
        break;
      default:
        this.showErrorMessage(t('unknownError'), t('anErrorOccurred'));
    }
  }

  private handleCustomError(error: CustomError): void {
    const { code, message, details } = error.details;
    this.showErrorMessage(t(code), message, 'error', details);
  }

  private handleGenericError(error: Error): void {
    this.showErrorMessage(t('unknownError'), error.message);
  }

  private showErrorMessage(title: string, description: string, type: 'error' | 'warning' = 'error', details?: any): void {
    notification[type]({
      message: title,
      description,
      duration: 0,
      onClick: () => {
        if (details) {
          console.log('Error details:', details);
        }
      },
    });
  }

  private showValidationErrors(errors: { [key: string]: string[] }): void {
    Object.entries(errors).forEach(([field, messages]) => {
      messages.forEach(msg => {
        message.error(`${field}: ${msg}`);
      });
    });
  }

  private logError(error: Error | AxiosError | CustomError): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Detailed error:', error);
    }

    // Log to analytics in production
    if (process.env.NODE_ENV === 'production') {
      let errorDetails: any = {
        name: error.name,
        message: error.message,
      };

      if (this.isAxiosError(error)) {
        errorDetails = {
          ...errorDetails,
          status: error.response?.status,
          data: error.response?.data,
        };
      } else if (error instanceof CustomError) {
        errorDetails = {
          ...errorDetails,
          ...error.details,
        };
      }

      trackEvent('Error Occurred', errorDetails);
    }

    // Here you could also integrate with an error logging service like Sentry
    // Sentry.captureException(error);
  }

  public createCustomError(code: string, message: string, details?: any): CustomError {
    return new CustomError({ code, message, details });
  }
}

export const errorHandler = ErrorHandler.getInstance();

// Higher-order function for wrapping async functions with error handling
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handleError(error as Error);
      throw error;
    }
  }) as T;
}

// React error boundary
import React, { ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    errorHandler.handleError(error);
    console.error('Uncaught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
