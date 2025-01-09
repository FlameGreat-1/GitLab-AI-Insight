// src/pages/SettingsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Tabs, message, Button, Modal, List, Switch, Tooltip, Collapse, Input, Select } from 'antd';
import { SaveOutlined, UndoOutlined, QuestionCircleOutlined, LockOutlined, ApiOutlined, BellOutlined, TeamOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store/types';
import { fetchSettings, updateSettings, resetSettings } from '../store/actions/settingsActions';
import { UserSettings } from '../components/Settings/UserSettings';
import { AppSettings } from '../components/Settings/AppSettings';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { trackEvent } from '../utils/analytics';
import { debounce } from 'lodash';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;

const SettingsContainer = styled(motion.div)`
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
`;

const StyledTabs = styled(Tabs)`
  .ant-tabs-nav::before {
    border-bottom: none;
  }
`;

const SettingsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
`;

const SettingsActions = styled.div`
  display: flex;
  gap: 16px;
`;

const SettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { settings, loading, error } = useSelector((state: RootState) => state.settings);
  const [activeTab, setActiveTab] = useState('user');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const handleSettingChange = useCallback((key: string, value: any) => {
    dispatch(updateSettings({ [key]: value }));
    setUnsavedChanges(true);
    trackEvent('Setting Changed', { key, value });
  }, [dispatch]);

  const debouncedSettingChange = useCallback(
    debounce(handleSettingChange, 300),
    [handleSettingChange]
  );

  const handleSaveSettings = useCallback(async () => {
    try {
      await dispatch(updateSettings(settings)).unwrap();
      message.success(t('settingsSaved'));
      setUnsavedChanges(false);
      trackEvent('Settings Saved');
    } catch (error) {
      message.error(t('settingsSaveError'));
    }
  }, [dispatch, settings, t]);

  const handleResetSettings = useCallback(async () => {
    try {
      await dispatch(resetSettings()).unwrap();
      message.success(t('settingsReset'));
      setResetModalVisible(false);
      setUnsavedChanges(false);
      trackEvent('Settings Reset');
    } catch (error) {
      message.error(t('settingsResetError'));
    }
  }, [dispatch, t]);

  const renderSecuritySettings = () => (
    <Collapse>
      <Panel header={t('twoFactorAuthentication')} key="2fa">
        <Switch
          checked={settings.twoFactorEnabled}
          onChange={(checked) => handleSettingChange('twoFactorEnabled', checked)}
        />
        <Tooltip title={t('twoFactorHelp')}>
          <QuestionCircleOutlined style={{ marginLeft: 8 }} />
        </Tooltip>
      </Panel>
      <Panel header={t('sessionManagement')} key="session">
        <Input
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => handleSettingChange('sessionTimeout', e.target.value)}
          addonAfter="minutes"
        />
      </Panel>
      <Panel header={t('apiTokens')} key="apiTokens">
        <List
          dataSource={settings.apiTokens}
          renderItem={(token) => (
            <List.Item
              actions={[
                <Button danger onClick={() => handleSettingChange('apiTokens', settings.apiTokens.filter(t => t.id !== token.id))}>
                  {t('revoke')}
                </Button>
              ]}
            >
              <List.Item.Meta
                title={token.name}
                description={`${t('created')}: ${new Date(token.createdAt).toLocaleString()}`}
              />
            </List.Item>
          )}
        />
        <Button type="primary" onClick={() => {/* Implement token generation logic */}}>
          {t('generateNewToken')}
        </Button>
      </Panel>
    </Collapse>
  );

  const renderNotificationSettings = () => (
    <Collapse>
      <Panel header={t('emailNotifications')} key="email">
        <Switch
          checked={settings.emailNotificationsEnabled}
          onChange={(checked) => handleSettingChange('emailNotificationsEnabled', checked)}
        />
      </Panel>
      <Panel header={t('pushNotifications')} key="push">
        <Switch
          checked={settings.pushNotificationsEnabled}
          onChange={(checked) => handleSettingChange('pushNotificationsEnabled', checked)}
        />
      </Panel>
      <Panel header={t('notificationFrequency')} key="frequency">
        <Select
          value={settings.notificationFrequency}
          onChange={(value) => handleSettingChange('notificationFrequency', value)}
          style={{ width: 200 }}
        >
          <Option value="realtime">{t('realtime')}</Option>
          <Option value="hourly">{t('hourly')}</Option>
          <Option value="daily">{t('daily')}</Option>
          <Option value="weekly">{t('weekly')}</Option>
        </Select>
      </Panel>
    </Collapse>
  );

  const renderIntegrationSettings = () => (
    <Collapse>
      <Panel header={t('gitlabIntegration')} key="gitlab">
        <Input
          value={settings.gitlabUrl}
          onChange={(e) => handleSettingChange('gitlabUrl', e.target.value)}
          placeholder={t('gitlabUrlPlaceholder')}
        />
        <Input
          value={settings.gitlabToken}
          onChange={(e) => handleSettingChange('gitlabToken', e.target.value)}
          placeholder={t('gitlabTokenPlaceholder')}
          type="password"
        />
      </Panel>
      <Panel header={t('slackIntegration')} key="slack">
        <Switch
          checked={settings.slackIntegrationEnabled}
          onChange={(checked) => handleSettingChange('slackIntegrationEnabled', checked)}
        />
        {settings.slackIntegrationEnabled && (
          <Input
            value={settings.slackWebhookUrl}
            onChange={(e) => handleSettingChange('slackWebhookUrl', e.target.value)}
            placeholder={t('slackWebhookUrlPlaceholder')}
          />
        )}
      </Panel>
    </Collapse>
  );

  if (loading) return <LoadingSpinner />;
  if (error) {
    message.error(t('settingsLoadError'));
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <SettingsContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <SettingsHeader>
        <h1>{t('settings')}</h1>
        <SettingsActions>
          <Button 
            icon={<UndoOutlined />} 
            onClick={() => setResetModalVisible(true)}
            disabled={!unsavedChanges}
          >
            {t('resetChanges')}
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveSettings}
            disabled={!unsavedChanges}
          >
            {t('saveChanges')}
          </Button>
        </SettingsActions>
      </SettingsHeader>
      <StyledTabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={<span><TeamOutlined />{t('userSettings')}</span>} key="user">
          <UserSettings onChange={debouncedSettingChange} settings={settings} />
        </TabPane>
        <TabPane tab={<span><ApiOutlined />{t('appSettings')}</span>} key="app">
          <AppSettings onChange={debouncedSettingChange} settings={settings} />
        </TabPane>
        <TabPane tab={<span><LockOutlined />{t('security')}</span>} key="security">
          {renderSecuritySettings()}
        </TabPane>
        <TabPane tab={<span><BellOutlined />{t('notifications')}</span>} key="notifications">
          {renderNotificationSettings()}
        </TabPane>
        <TabPane tab={<span><ApiOutlined />{t('integrations')}</span>} key="integrations">
          {renderIntegrationSettings()}
        </TabPane>
      </StyledTabs>
      <Modal
        title={t('confirmReset')}
        visible={resetModalVisible}
        onOk={handleResetSettings}
        onCancel={() => setResetModalVisible(false)}
      >
        <p>{t('resetWarning')}</p>
      </Modal>
    </SettingsContainer>
  );
};

export default SettingsPage;
