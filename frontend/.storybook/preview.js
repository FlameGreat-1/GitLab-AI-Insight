// .storybook/preview.js

import { ThemeProvider } from 'styled-components';
import { addDecorator } from '@storybook/react';
import { withA11y } from '@storybook/addon-a11y';
import { INITIAL_VIEWPORTS } from '@storybook/addon-viewport';
import { lightTheme, darkTheme } from '../src/styles/theme';
import GlobalStyle from '../src/styles/globalStyle';
import { I18nextProvider } from 'react-i18next';
import i18n from '../src/i18n';

addDecorator(withA11y);

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  viewport: {
    viewports: INITIAL_VIEWPORTS,
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: lightTheme.colors.background,
      },
      {
        name: 'dark',
        value: darkTheme.colors.background,
      },
    ],
  },
  darkMode: {
    dark: { ...darkTheme },
    light: { ...lightTheme },
  },
};

const withThemeProvider = (Story, context) => {
  const theme = context.globals.theme === 'dark' ? darkTheme : lightTheme;
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <I18nextProvider i18n={i18n}>
        <Story {...context} />
      </I18nextProvider>
    </ThemeProvider>
  );
};

export const decorators = [withThemeProvider];

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: ['light', 'dark'],
    },
  },
  locale: {
    name: 'Locale',
    description: 'Internationalization locale',
    defaultValue: 'en',
    toolbar: {
      icon: 'globe',
      items: [
        { value: 'en', right: '🇺🇸', title: 'English' },
        { value: 'es', right: '🇪🇸', title: 'Español' },
      ],
    },
  },
};
