// src/components/Auth/Logout.tsx

import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Modal, Button, Progress, message } from 'antd';
import { LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState } from '../../store/types';
import { logout, clearUserData } from '../../store/actions/authActions';
import { trackEvent } from '../../utils/analytics';
import { clearLocalStorage, clearSessionStorage, clearCookies } from '../../utils/storageUtils';
import { LoadingSpinner } from '../Common/LoadingSpinner';

const { confirm } = Modal;

const LogoutContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: ${props => props.theme.colors.background};
`;

const LogoutButton = styled(Button)`
  margin-bottom: 20px;
`;

const ProgressContainer = styled.div`
  width: 300px;
  text-align: center;
`;

const Logout: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [progress, setProgress] = useState(0);

  const performLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      // Simulate a multi-step logout process
      await simulateLogoutStep('Closing active sessions', 20);
      await simulateLogoutStep('Clearing local data', 40);
      await simulateLogoutStep('Revoking tokens', 60);
      await simulateLogoutStep('Updating server state', 80);

      // Actual logout actions
      await dispatch(logout());
      clearLocalStorage();
      clearSessionStorage();
      clearCookies();
      await dispatch(clearUserData());

      trackEvent('User Logout', { userId: user?.id });

      setProgress(100);
      message.success(t('logoutSuccess'));
      setTimeout(() => navigate('/login'), 1000);
    } catch (error) {
      console.error('Logout failed:', error);
      message.error(t('logoutError'));
      setIsLoggingOut(false);
    }
  }, [dispatch, navigate, t, user]);

  const simulateLogoutStep = async (stepName: string, progressValue: number) => {
    return new Promise<void>(resolve => {
      setTimeout(() => {
        setProgress(progressValue);
        console.log(stepName);
        resolve();
      }, 500);
    });
  };

  const showLogoutConfirm = () => {
    confirm({
      title: t('logoutConfirmTitle'),
      icon: <ExclamationCircleOutlined />,
      content: t('logoutConfirmContent'),
      onOk() {
        performLogout();
      },
      onCancel() {
        console.log('Logout cancelled');
      },
    });
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <LogoutContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {!isLoggingOut && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <LogoutButton 
              type="primary" 
              icon={<LogoutOutlined />} 
              onClick={showLogoutConfirm}
              size="large"
            >
              {t('logout')}
            </LogoutButton>
          </motion.div>
        )}
      </AnimatePresence>
      {isLoggingOut && (
        <ProgressContainer>
          <Progress percent={progress} status="active" />
          <p>{t('loggingOut')}</p>
        </ProgressContainer>
      )}
    </LogoutContainer>
  );
};

export default Logout;
