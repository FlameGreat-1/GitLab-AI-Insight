// src/components/Auth/Login.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, Checkbox, message, Tooltip, Modal } from 'antd';
import { FormInstance } from 'antd/lib/form';
import { UserOutlined, LockOutlined, GithubOutlined, GoogleOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { AppDispatch, RootState } from '../../store/types';
import { login, loginWithOAuth } from '../../store/slices/authSlice';
import LoadingSpinner from '../Common/LoadingSpinner';
import { validatePassword, generateStrongPassword } from '../../utils/passwordUtils';
import { trackEvent } from '../../utils/analytics';

const LoginContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: ${props => props.theme.colors.loginBackground};
`;

const StyledForm = styled(Form)`
  width: 100%;
  max-width: 400px;
  padding: 2rem;
  background: ${props => props.theme.colors.cardBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h1`
  text-align: center;
  color: ${props => props.theme.colors.primaryText};
  margin-bottom: 2rem;
`;

const StyledInput = styled(Input)`
  margin-bottom: 1rem;
`;

const StyledPasswordInput = styled(Input.Password)`
  margin-bottom: 1rem;
`;

const RememberMeContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const OAuthContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 1rem;
`;

const OAuthButton = styled(Button)`
  margin: 0 0.5rem;
`;

const PasswordStrengthIndicator = styled.div<{ strength: number }>`
  height: 4px;
  width: 100%;
  background: ${props => {
    if (props.strength < 2) return props.theme.colors.danger;
    if (props.strength < 4) return props.theme.colors.warning;
    return props.theme.colors.success;
  }};
  transition: all 0.3s ease;
  margin-bottom: 1rem;
`;

interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

const Login: React.FC = () => {
  const [form] = Form.useForm<LoginFormValues>();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showPasswordHelp, setShowPasswordHelp] = useState(false);

  useEffect(() => {
    if (error) {
      message.error(t(error));
    }
  }, [error, t]);

  const handleLogin = useCallback(async (values: LoginFormValues) => {
    try {
      await dispatch(login(values)).unwrap();
      trackEvent('User Login', { method: 'Email' });
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
    }
  }, [dispatch, navigate]);

  const handleOAuthLogin = useCallback(async (provider: string) => {
    try {
      await dispatch(loginWithOAuth(provider)).unwrap();
      trackEvent('User Login', { method: provider });
      navigate('/dashboard');
    } catch (err) {
      console.error(`${provider} login failed:`, err);
    }
  }, [dispatch, navigate]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = validatePassword(e.target.value);
    setPasswordStrength(strength);
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    form.setFieldsValue({ password: newPassword });
    setPasswordStrength(5);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <LoginContainer
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <StyledForm form={form} onFinish={handleLogin}>
        <Title>{t('login')}</Title>
        <Form.Item
          name="email"
          rules={[{ required: true, message: t('emailRequired') || 'Email is required' }]}
        >
          <StyledInput
            prefix={<UserOutlined />}
            placeholder={t('email') || undefined}
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: t('passwordRequired') || 'Password is required' }]}
        >
          <StyledPasswordInput
            prefix={<LockOutlined />}
            placeholder={t('password') || undefined}
            onChange={handlePasswordChange}
          />
        </Form.Item>
        <PasswordStrengthIndicator strength={passwordStrength} />
        <RememberMeContainer>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>{t('rememberMe')}</Checkbox>
          </Form.Item>
          <Link to="/forgot-password">{t('forgotPassword')}</Link>
        </RememberMeContainer>
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {t('login')}
          </Button>
        </Form.Item>
        <OAuthContainer>
          <OAuthButton icon={<GithubOutlined />} onClick={() => handleOAuthLogin('github')}>
            GitHub
          </OAuthButton>
          <OAuthButton icon={<GoogleOutlined />} onClick={() => handleOAuthLogin('google')}>
            Google
          </OAuthButton>
        </OAuthContainer>
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          {t('noAccount')} <Link to="/register">{t('register')}</Link>
        </div>
      </StyledForm>
      <Tooltip title={t('passwordHelp')}>
        <QuestionCircleOutlined 
          style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem' }}
          onClick={() => setShowPasswordHelp(true)}
        />
      </Tooltip>
      <Modal
        title={t('passwordHelpTitle')}
        visible={showPasswordHelp}
        onOk={() => setShowPasswordHelp(false)}
        onCancel={() => setShowPasswordHelp(false)}
        footer={[
          <Button key="close" onClick={() => setShowPasswordHelp(false)}>
            {t('close')}
          </Button>,
          <Button key="generate" type="primary" onClick={handleGeneratePassword}>
            {t('generatePassword')}
          </Button>
        ]}
      >
        <p>{t('passwordHelpContent')}</p>
      </Modal>
    </LoginContainer>
  );
};

export default Login;
