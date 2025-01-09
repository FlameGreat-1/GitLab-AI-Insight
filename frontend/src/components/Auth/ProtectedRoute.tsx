// src/components/Auth/ProtectedRoute.tsx

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Route, Navigate, useLocation } from 'react-router-dom';
import { message, Modal } from 'antd';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store/types';
import { refreshToken, logout } from '../../store/actions/authActions';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { checkPermission } from '../../utils/permissionUtils';
import { trackEvent } from '../../utils/analytics';

interface ProtectedRouteProps {
  component: React.ComponentType<any>;
  requiredRoles?: string[];
  path: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  component: Component,
  requiredRoles = [],
  ...rest
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { t } = useTranslation();
  const { user, isAuthenticated, tokenExpiresAt } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (isAuthenticated && user) {
        // Check if token is about to expire
        const now = Date.now();
        const timeUntilExpire = tokenExpiresAt - now;

        if (timeUntilExpire < 5 * 60 * 1000) { // Less than 5 minutes until expiration
          try {
            await dispatch(refreshToken());
          } catch (error) {
            console.error('Token refresh failed:', error);
            message.error(t('sessionExpired'));
            dispatch(logout());
          }
        }

        // Check user permissions
        if (requiredRoles.length > 0 && !checkPermission(user.roles, requiredRoles)) {
          message.error(t('insufficientPermissions'));
          trackEvent('Access Denied', { 
            userId: user.id, 
            requiredRoles, 
            userRoles: user.roles,
            path: location.pathname 
          });
        }
      }
      setIsChecking(false);
    };

    checkAuth();

    // Set up interval to check token expiration
    const intervalId = setInterval(checkAuth, 60000); // Check every minute

    return () => clearInterval(intervalId);
  }, [dispatch, isAuthenticated, user, tokenExpiresAt, requiredRoles, location, t]);

  if (isChecking) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles.length > 0 && !checkPermission(user!.roles, requiredRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Session timeout warning
  useEffect(() => {
    let timeoutWarning: NodeJS.Timeout;
    let timeoutLogout: NodeJS.Timeout;

    if (isAuthenticated && tokenExpiresAt) {
      const timeUntilExpire = tokenExpiresAt - Date.now();
      const warningTime = 5 * 60 * 1000; // 5 minutes before expiration

      if (timeUntilExpire > warningTime) {
        timeoutWarning = setTimeout(() => {
          Modal.warning({
            title: t('sessionExpirationWarning'),
            content: t('sessionExpirationWarningContent'),
            okText: t('extendSession'),
            onOk: () => dispatch(refreshToken()),
          });
        }, timeUntilExpire - warningTime);

        timeoutLogout = setTimeout(() => {
          dispatch(logout());
          message.error(t('sessionExpired'));
        }, timeUntilExpire);
      }
    }

    return () => {
      clearTimeout(timeoutWarning);
      clearTimeout(timeoutLogout);
    };
  }, [isAuthenticated, tokenExpiresAt, dispatch, t]);

  return (
    <Route
      {...rest}
      element={
        <Component />
      }
    />
  );
};

export default ProtectedRoute;
