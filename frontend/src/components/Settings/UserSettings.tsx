// src/components/Settings/UserSettings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Form, Input, Button, Switch, Select, Upload, message, Tabs, Popconfirm, Modal } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store/types';
import { updateUserProfile, changePassword, deleteAccount, updateNotificationPreferences } from '../../store/actions/userActions';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { validatePassword, generateStrongPassword } from '../../utils/passwordUtils';
import { trackEvent } from '../../utils/analytics';
import { debounce } from 'lodash';

const { TabPane } = Tabs;
const { Option } = Select;

const SettingsContainer = styled(motion.div)`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: ${props => props.theme.colors.cardBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledForm = styled(Form)`
  .ant-form-item {
    margin-bottom: 1.5rem;
  }
`;

const AvatarUpload = styled(Upload)`
  .ant-upload {
    width: 128px;
    height: 128px;
    border-radius: 50%;
    overflow: hidden;
  }
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

const UserSettings: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { user, loading } = useSelector((state: RootState) => state.user);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [activeTab, setActiveTab] = useState('profile');
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        phone: user.phone,
        notificationPreferences: user.notificationPreferences,
      });
    }
  }, [user, form]);

  const handleProfileUpdate = useCallback(async (values: any) => {
    try {
      await dispatch(updateUserProfile(values));
      message.success(t('profileUpdateSuccess'));
      trackEvent('User Profile Update');
    } catch (error) {
      message.error(t('profileUpdateError'));
    }
  }, [dispatch, t]);

  const handlePasswordChange = useCallback(async (values: any) => {
    try {
      await dispatch(changePassword(values));
      message.success(t('passwordChangeSuccess'));
      trackEvent('Password Change');
      form.resetFields(['currentPassword', 'newPassword', 'confirmPassword']);
    } catch (error) {
      message.error(t('passwordChangeError'));
    }
  }, [dispatch, t, form]);

  const handleNotificationPreferencesUpdate = useCallback(async (values: any) => {
    try {
      await dispatch(updateNotificationPreferences(values));
      message.success(t('notificationPreferencesUpdateSuccess'));
      trackEvent('Notification Preferences Update');
    } catch (error) {
      message.error(t('notificationPreferencesUpdateError'));
    }
  }, [dispatch, t]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await dispatch(deleteAccount());
      message.success(t('accountDeleteSuccess'));
      trackEvent('Account Deletion');
      // Redirect to login or home page
    } catch (error) {
      message.error(t('accountDeleteError'));
    }
  }, [dispatch, t]);

  const handlePasswordStrengthChange = debounce((password: string) => {
    const strength = validatePassword(password);
    setPasswordStrength(strength);
  }, 300);

  const handleGeneratePassword = () => {
    const newPassword = generateStrongPassword();
    form.setFieldsValue({ newPassword, confirmPassword: newPassword });
    handlePasswordStrengthChange(newPassword);
  };

  const renderProfileSettings = () => (
    <StyledForm form={form} onFinish={handleProfileUpdate} layout="vertical">
      <Form.Item name="avatar">
        <AvatarUpload
          name="avatar"
          listType="picture-card"
          showUploadList={false}
          action="/api/upload-avatar"
          beforeUpload={file => {
            const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
            if (!isJpgOrPng) {
              message.error(t('onlyJpgPngAllowed'));
            }
            const isLt2M = file.size / 1024 / 1024 < 2;
            if (!isLt2M) {
              message.error(t('imageMustSmallerThan2MB'));
            }
            return isJpgOrPng && isLt2M;
          }}
        >
          {user?.avatar ? <img src={user.avatar} alt="avatar" style={{ width: '100%' }} /> : <UploadOutlined />}
        </AvatarUpload>
      </Form.Item>
      <Form.Item name="username" rules={[{ required: true, message: t('usernameRequired') }]}>
        <Input prefix={<UserOutlined />} placeholder={t('username')} />
      </Form.Item>
      <Form.Item name="email" rules={[{ required: true, type: 'email', message: t('validEmailRequired') }]}>
        <Input prefix={<MailOutlined />} placeholder={t('email')} />
      </Form.Item>
      <Form.Item name="phone">
        <Input prefix={<PhoneOutlined />} placeholder={t('phone')} />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('updateProfile')}
        </Button>
      </Form.Item>
    </StyledForm>
  );

  const renderSecuritySettings = () => (
    <StyledForm form={form} onFinish={handlePasswordChange} layout="vertical">
      <Form.Item name="currentPassword" rules={[{ required: true, message: t('currentPasswordRequired') }]}>
        <Input.Password prefix={<LockOutlined />} placeholder={t('currentPassword')} />
      </Form.Item>
      <Form.Item name="newPassword" rules={[{ required: true, message: t('newPasswordRequired') }]}>
        <Input.Password 
          prefix={<LockOutlined />} 
          placeholder={t('newPassword')} 
          onChange={e => handlePasswordStrengthChange(e.target.value)}
        />
      </Form.Item>
      <PasswordStrengthIndicator strength={passwordStrength} />
      <Form.Item
        name="confirmPassword"
        dependencies={['newPassword']}
        rules={[
          { required: true, message: t('confirmPasswordRequired') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('newPassword') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('passwordsMustMatch')));
            },
          }),
        ]}
      >
        <Input.Password prefix={<LockOutlined />} placeholder={t('confirmPassword')} />
      </Form.Item>
      <Form.Item>
        <Button onClick={handleGeneratePassword} style={{ marginRight: 8 }}>
          {t('generateStrongPassword')}
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('changePassword')}
        </Button>
      </Form.Item>
    </StyledForm>
  );

  const renderNotificationSettings = () => (
    <StyledForm form={form} onFinish={handleNotificationPreferencesUpdate} layout="vertical">
      <Form.Item name="emailNotifications" valuePropName="checked">
        <Switch checkedChildren={t('on')} unCheckedChildren={t('off')} />
      </Form.Item>
      <Form.Item name="pushNotifications" valuePropName="checked">
        <Switch checkedChildren={t('on')} unCheckedChildren={t('off')} />
      </Form.Item>
      <Form.Item name="notificationFrequency">
        <Select placeholder={t('selectNotificationFrequency')}>
          <Option value="realtime">{t('realtime')}</Option>
          <Option value="daily">{t('daily')}</Option>
          <Option value="weekly">{t('weekly')}</Option>
        </Select>
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          {t('updateNotificationPreferences')}
        </Button>
      </Form.Item>
    </StyledForm>
  );

  const renderDangerZone = () => (
    <div>
      <h3>{t('dangerZone')}</h3>
      <Popconfirm
        title={t('deleteAccountConfirmation')}
        onConfirm={() => setDeleteModalVisible(true)}
        okText={t('yes')}
        cancelText={t('no')}
      >
        <Button danger icon={<DeleteOutlined />}>
          {t('deleteAccount')}
        </Button>
      </Popconfirm>
    </div>
  );

  return (
    <SettingsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('profile')} key="profile">
          {renderProfileSettings()}
        </TabPane>
        <TabPane tab={t('security')} key="security">
          {renderSecuritySettings()}
        </TabPane>
        <TabPane tab={t('notifications')} key="notifications">
          {renderNotificationSettings()}
        </TabPane>
        <TabPane tab={t('dangerZone')} key="dangerZone">
          {renderDangerZone()}
        </TabPane>
      </Tabs>
      <Modal
        title={t('deleteAccountConfirmation')}
        visible={deleteModalVisible}
        onOk={handleDeleteAccount}
        onCancel={() => setDeleteModalVisible(false)}
        okText={t('deleteAccount')}
        cancelText={t('cancel')}
      >
        <p>{t('deleteAccountWarning')}</p>
        <Input placeholder={t('typeUsernameToConfirm')} />
      </Modal>
    </SettingsContainer>
  );
};

export default UserSettings;
