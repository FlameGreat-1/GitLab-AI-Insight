// src/components/Auth/Register.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { Form, Input, Button, Checkbox, message, Tooltip, Modal, Steps, Result } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ReCAPTCHA from "react-google-recaptcha";
import { RootState } from '../../store/types';
import { register, checkUsernameAvailability, checkEmailAvailability } from '../../store/actions/authActions';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { validatePassword, generateStrongPassword } from '../../utils/passwordUtils';
import { trackEvent } from '../../utils/analytics';
import { debounce } from 'lodash';

const { Step } = Steps;

const RegisterContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  background: ${props => props.theme.colors.registerBackground};
`;

const RegisterForm = styled(Form)`
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

const Register: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  useEffect(() => {
    if (error) {
      message.error(t(error));
    }
  }, [error, t]);

  const handleRegister = useCallback(async (values: any) => {
    if (!recaptchaValue) {
      message.error(t('pleaseCompleteCaptcha'));
      return;
    }

    try {
      await dispatch(register({ ...values, recaptcha: recaptchaValue }));
      trackEvent('User Registration', { method: 'Email' });
      setRegistrationComplete(true);
    } catch (err) {
      console.error('Registration failed:', err);
    }
  }, [dispatch, recaptchaValue, t]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const strength = validatePassword(e.target.value);
    setPasswordStrength(strength);
  };

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    form.setFieldsValue({ password: newPassword, confirmPassword: newPassword });
    setPasswordStrength(5);
  };

  const checkUsername = useCallback(debounce(async (username: string) => {
    if (username) {
      const isAvailable = await dispatch(checkUsernameAvailability(username));
      if (!isAvailable) {
        form.setFields([
          {
            name: 'username',
            errors: [t('usernameNotAvailable')],
          },
        ]);
      }
    }
  }, 500), [dispatch, form, t]);

  const checkEmail = useCallback(debounce(async (email: string) => {
    if (email) {
      const isAvailable = await dispatch(checkEmailAvailability(email));
      if (!isAvailable) {
        form.setFields([
          {
            name: 'email',
            errors: [t('emailAlreadyRegistered')],
          },
        ]);
      }
    }
  }, 500), [dispatch, form, t]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Form.Item
              name="username"
              rules={[{ required: true, message: t('usernameRequired') }]}
            >
              <StyledInput
                prefix={<UserOutlined />}
                placeholder={t('username')}
                onChange={(e) => checkUsername(e.target.value)}
              />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('emailRequired') },
                { type: 'email', message: t('invalidEmail') }
              ]}
            >
              <StyledInput
                prefix={<MailOutlined />}
                placeholder={t('email')}
                onChange={(e) => checkEmail(e.target.value)}
              />
            </Form.Item>
          </>
        );
      case 1:
        return (
          <>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('passwordRequired') },
                { min: 8, message: t('passwordTooShort') }
              ]}
            >
              <StyledPasswordInput
                prefix={<LockOutlined />}
                placeholder={t('password')}
                onChange={handlePasswordChange}
              />
            </Form.Item>
            <PasswordStrengthIndicator strength={passwordStrength} />
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('passwordsMustMatch')));
                  },
                }),
              ]}
            >
              <StyledPasswordInput
                prefix={<LockOutlined />}
                placeholder={t('confirmPassword')}
              />
            </Form.Item>
            <Button onClick={handleGeneratePassword}>{t('generateStrongPassword')}</Button>
          </>
        );
      case 2:
        return (
          <>
            <Form.Item
              name="phone"
              rules={[{ required: true, message: t('phoneRequired') }]}
            >
              <StyledInput
                prefix={<PhoneOutlined />}
                placeholder={t('phone')}
              />
            </Form.Item>
            <Form.Item
              name="agreement"
              valuePropName="checked"
              rules={[
                { validator: (_, value) => value ? Promise.resolve() : Promise.reject(new Error(t('agreementRequired'))) },
              ]}
            >
              <Checkbox>{t('agreeToTerms')} <Link to="/terms">{t('termsAndConditions')}</Link></Checkbox>
            </Form.Item>
            <ReCAPTCHA
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY!}
              onChange={setRecaptchaValue}
            />
          </>
        );
      default:
        return null;
    }
  };

  if (registrationComplete) {
    return (
      <RegisterContainer>
        <Result
          status="success"
          title={t('registrationSuccessful')}
          subTitle={t('pleaseCheckEmail')}
          extra={[
            <Button type="primary" key="console" onClick={() => navigate('/login')}>
              {t('goToLogin')}
            </Button>,
          ]}
        />
      </RegisterContainer>
    );
  }

  return (
    <RegisterContainer
      initial={{ opacity: 0, y: -50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <RegisterForm form={form} onFinish={handleRegister}>
        <Title>{t('register')}</Title>
        <Steps current={currentStep} style={{ marginBottom: '2rem' }}>
          <Step title={t('accountInfo')} />
          <Step title={t('security')} />
          <Step title={t('verification')} />
        </Steps>
        {renderStep()}
        <Form.Item>
          {currentStep > 0 && (
            <Button style={{ marginRight: 8 }} onClick={() => setCurrentStep(currentStep - 1)}>
              {t('previous')}
            </Button>
          )}
          {currentStep < 2 ? (
            <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)}>
              {t('next')}
            </Button>
          ) : (
            <Button type="primary" htmlType="submit" loading={loading}>
              {t('register')}
            </Button>
          )}
        </Form.Item>
      </RegisterForm>
      <Tooltip title={t('needHelp')}>
        <InfoCircleOutlined 
          style={{ position: 'absolute', right: '1rem', top: '1rem', fontSize: '1.5rem' }}
          onClick={() => message.info(t('contactSupport'))}
        />
      </Tooltip>
    </RegisterContainer>
  );
};

export default Register;
