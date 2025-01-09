// src/styles/theme.ts

import { DefaultTheme } from 'styled-components';

export const lightTheme: DefaultTheme = {
  colors: {
    primary: '#1890ff',
    secondary: '#52c41a',
    background: '#f0f2f5',
    text: '#000000d9',
    border: '#d9d9d9',
  },
  fonts: {
    body: 'Roboto, sans-serif',
    heading: 'Roboto, sans-serif',
  },
  fontSizes: {
    small: '0.875rem',
    medium: '1rem',
    large: '1.25rem',
  },
  spacing: {
    small: '0.5rem',
    medium: '1rem',
    large: '1.5rem',
  },
  borderRadius: '4px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  transition: '0.3s ease',
};

export const darkTheme: DefaultTheme = {
  ...lightTheme,
  colors: {
    ...lightTheme.colors,
    background: '#1f1f1f',
    text: '#ffffff',
    border: '#434343',
  },
};

export const getTheme = (isDarkMode: boolean) => (isDarkMode ? darkTheme : lightTheme);
