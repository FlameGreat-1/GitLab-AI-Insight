import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

interface SettingsState {
  theme: 'light' | 'dark';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
  };
  dataRefreshInterval: number;
}

const initialState: SettingsState = {
  theme: 'light',
  language: 'en',
  notifications: {
    email: true,
    push: true,
  },
  dataRefreshInterval: 5 * 60 * 1000, // 5 minutes in milliseconds
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setNotificationPreference: (
      state,
      action: PayloadAction<{ type: 'email' | 'push'; enabled: boolean }>
    ) => {
      const { type, enabled } = action.payload;
      state.notifications[type] = enabled;
    },
    setDataRefreshInterval: (state, action: PayloadAction<number>) => {
      state.dataRefreshInterval = action.payload;
    },
    resetSettings: () => initialState,
  },
});

export const {
  setTheme,
  setLanguage,
  setNotificationPreference,
  setDataRefreshInterval,
  resetSettings,
} = settingsSlice.actions;

export const selectTheme = (state: RootState) => state.settings.theme;
export const selectLanguage = (state: RootState) => state.settings.language;
export const selectNotifications = (state: RootState) => state.settings.notifications;
export const selectDataRefreshInterval = (state: RootState) => state.settings.dataRefreshInterval;

export default settingsSlice.reducer;
