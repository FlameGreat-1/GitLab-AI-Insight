// src/components/Auth/AuthComponent.tsx

import React from 'react';
import { Button, Form, Input, message } from 'antd';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

interface LoginFormProps {
  onSubmit: (credentials: { username: string; password: string }) => Promise<void>;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    try {
      await onSubmit(values);
    } catch (error) {
      message.error(t('loginError') as string);
    }
  };

  return (
    <Form form={form} onFinish={handleSubmit}>
      <Form.Item
        name="username"
        rules={[{ required: true, message: t('usernameRequired') as string }]}
      >
        <Input placeholder={t('username') as string} />
      </Form.Item>
      <Form.Item
        name="password"
        rules={[{ required: true, message: t('passwordRequired') as string }]}
      >
        <Input.Password placeholder={t('password') as string} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          {t('login')}
        </Button>
      </Form.Item>
    </Form>
  );
};

const AdminPanel: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('adminPanel')}</h2>
      <p>{t('adminPanelDescription')}</p>
    </div>
  );
};

const AuthComponent: React.FC = () => {
  const { isAuthenticated, user, login, logout, checkPermission } = useAuth();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <LoginForm onSubmit={login} />;
  }

  return (
    <div>
      <h1>{t('welcome', { name: user.name })}</h1>
      {checkPermission('admin') && <AdminPanel />}
      <Button onClick={logout}>{t('logout')}</Button>
    </div>
  );
};

export default AuthComponent;
