// src/hooks/useAuth.ts

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import jwtDecode from 'jwt-decode';
import { v4 as uuidv4 } from 'uuid';
import { RootState } from '../store/types';
import { login, logout, refreshToken, updateUser } from '../store/actions/authActions';
import { setAuthToken, removeAuthToken, getAuthToken } from '../utils/tokenStorage';
import { trackEvent } from '../utils/analytics';

interface DecodedToken {
  exp: number;
  user_id: string;
  roles: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const authState = useSelector((state: RootState) => state.auth);
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    loading: true,
    error: null,
  });

  const initializeAuth = useCallback(async () => {
    const token = getAuthToken();
    if (token) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(token);
        if (Date.now() >= decodedToken.exp * 1000) {
          await handleRefreshToken();
        } else {
          setAuthState(token, decodedToken);
        }
      } catch (error) {
        console.error('Token decoding error:', error);
        handleLogout();
      }
    }
    setState(prev => ({ ...prev, loading: false }));
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    setState(prev => ({
      ...prev,
      isAuthenticated: authState.isAuthenticated,
      user: authState.user,
      token: authState.token,
      error: authState.error,
    }));
  }, [authState]);

  const setAuthState = useCallback((token: string, decodedToken: DecodedToken) => {
    setAuthToken(token);
    setState(prev => ({
      ...prev,
      isAuthenticated: true,
      user: { id: decodedToken.user_id, roles: decodedToken.roles },
      token,
      loading: false,
    }));
  }, []);

  const handleLogin = useCallback(async (credentials: { username: string; password: string }) => {
    try {
      const sessionId = uuidv4();
      const result = await dispatch(login({ ...credentials, sessionId })).unwrap();
      setAuthState(result.token, jwtDecode<DecodedToken>(result.token));
      message.success(t('loginSuccess'));
      trackEvent('User Logged In', { username: credentials.username });
      navigate('/dashboard');
    } catch (error) {
      message.error(t('loginError'));
      setState(prev => ({ ...prev, error: 'Login failed' }));
    }
  }, [dispatch, navigate, setAuthState, t]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    removeAuthToken();
    setState({
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    });
    message.info(t('logoutSuccess'));
    trackEvent('User Logged Out');
    navigate('/login');
  }, [dispatch, navigate, t]);

  const handleRefreshToken = useCallback(async () => {
    try {
      const result = await dispatch(refreshToken()).unwrap();
      setAuthState(result.token, jwtDecode<DecodedToken>(result.token));
    } catch (error) {
      console.error('Token refresh error:', error);
      handleLogout();
    }
  }, [dispatch, setAuthState, handleLogout]);

  const updateUserProfile = useCallback(async (userData: any) => {
    try {
      const updatedUser = await dispatch(updateUser(userData)).unwrap();
      setState(prev => ({ ...prev, user: updatedUser }));
      message.success(t('profileUpdateSuccess'));
      trackEvent('User Profile Updated');
    } catch (error) {
      message.error(t('profileUpdateError'));
    }
  }, [dispatch, t]);

  const checkPermission = useCallback((requiredPermission: string): boolean => {
    return state.user?.roles.includes(requiredPermission) || false;
  }, [state.user]);

  const isTokenExpired = useMemo(() => {
    if (!state.token) return true;
    try {
      const decodedToken = jwtDecode<DecodedToken>(state.token);
      return Date.now() >= decodedToken.exp * 1000;
    } catch {
      return true;
    }
  }, [state.token]);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    if (state.isAuthenticated && !isTokenExpired) {
      refreshInterval = setInterval(() => {
        handleRefreshToken();
      }, 15 * 60 * 1000); // Refresh token every 15 minutes
    }
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [state.isAuthenticated, isTokenExpired, handleRefreshToken]);

  return {
    ...state,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
    updateUserProfile,
    checkPermission,
    isTokenExpired,
  };
};
