// src/App.tsx

import React, { useEffect, useState, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider } from 'styled-components';
import { ConfigProvider, message, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './components/Auth/Login';
import Header from './components/Common/Header';
import Sidebar from './components/Common/Sidebar';
import NotFoundPage from './pages/NotFoundPage';
import { RootState, AppDispatch } from './store/types';
import { lightTheme, darkTheme } from './styles/theme';
import GlobalStyle from './styles/globalStyle';
import { websocketService } from './services/websocket';
import { setOnline, setOffline } from './store/actions/networkActions';
import { fetchUserData } from './store/actions/userActions';
import { trackPageView } from './utils/analytics';
import ErrorBoundary from './components/Common/ErrorBoundary';

// Lazy-loaded components
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard'));
const AdminPanel = React.lazy(() => import('./components/Admin/AdminPanel'));
const ProjectList = React.lazy(() => import('./components/Projects/ProjectList'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));
const MLInsightsPage = React.lazy(() => import('./pages/MLInsightsPage'));
const CollaborationPage = React.lazy(() => import('./pages/CollaborationPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));

const App: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [isLoading, setIsLoading] = useState(true);

  const theme = isDarkMode ? darkTheme : lightTheme;

  useEffect(() => {
    const initializeApp = async () => {
      if (token) {
        try {
          await dispatch(fetchUserData());
          websocketService.connect(token);
        } catch (error) {
          console.error('Failed to initialize app:', error);
          message.error(t('initializationError'));
        }
      }
      setIsLoading(false);
    };

    initializeApp();

    const handleOnline = () => dispatch(setOnline());
    const handleOffline = () => dispatch(setOffline());

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      websocketService.disconnect();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch, token, t]);

  useEffect(() => {
    const handleCustomEvent = (data: any) => {
      console.log('Received custom event:', data);
      // Handle the custom event
    };

    websocketService.on('CUSTOM_EVENT', handleCustomEvent);

    return () => {
      websocketService.off('CUSTOM_EVENT', handleCustomEvent);
    };
  }, []);

  useEffect(() => {
    trackPageView();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip={t('loading')} />
      </div>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: theme.colors.primary,
            colorBgContainer: theme.colors.background,
            colorText: theme.colors.text,
          },
        }}
      >
        <GlobalStyle />
        <ErrorBoundary>
          <Router>
            <div className="app-container">
              <Header />
              <div className="main-content">
                <Sidebar />
                <div className="page-content">
                  <Suspense fallback={<Spin size="large" />}>
                    <Routes>
                      <Route path="/login" element={<Login />} />
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute 
                            component={Dashboard} 
                            requiredRoles={['user', 'admin']} 
                          />
                        } 
                      />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute 
                            component={AdminPanel} 
                            requiredRoles={['admin']} 
                          />
                        } 
                      />
                      <Route 
                        path="/projects" 
                        element={
                          <ProtectedRoute 
                            component={ProjectList} 
                            requiredRoles={['user', 'admin']} 
                          />
                        } 
                      />
                      <Route 
                        path="/analytics" 
                        element={
                          <ProtectedRoute 
                            component={AnalyticsPage} 
                            requiredRoles={['user', 'admin', 'analyst']} 
                          />
                        } 
                      />
                      <Route 
                        path="/ml-insights" 
                        element={
                          <ProtectedRoute 
                            component={MLInsightsPage} 
                            requiredRoles={['data-scientist', 'admin']} 
                          />
                        } 
                      />
                      <Route 
                        path="/collaboration" 
                        element={
                          <ProtectedRoute 
                            component={CollaborationPage} 
                            requiredRoles={['user', 'admin']} 
                          />
                        } 
                      />
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute 
                            component={SettingsPage} 
                            requiredRoles={['user', 'admin']} 
                          />
                        } 
                      />
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </Suspense>
                </div>
              </div>
            </div>
          </Router>
        </ErrorBoundary>
      </ConfigProvider>
    </ThemeProvider>
  );
};

export default App;
