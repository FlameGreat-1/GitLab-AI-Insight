// src/components/Settings/AppSettings.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Form, Input, Button, Switch, Select, Slider, ColorPicker, Tabs, message, Modal } from 'antd';
import { SaveOutlined, UndoOutlined, ExportOutlined, ImportOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store/types';
import { updateAppSettings, resetAppSettings, exportAppSettings, importAppSettings } from '../../store/actions/settingsActions';
import { setTheme } from '../../store/actions/themeActions';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { debounce } from 'lodash';
import { trackEvent } from '../../utils/analytics';

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

const ColorPreview = styled.div<{ color: string }>`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: ${props => props.color};
  margin-left: 10px;
`;

const AppSettings: React.FC = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const { settings, loading } = useSelector((state: RootState) => state.appSettings);
  const theme = useSelector((state: RootState) => state.theme);
  const [activeTab, setActiveTab] = useState('general');
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importData, setImportData] = useState('');

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const handleSettingsUpdate = useCallback(async (values: any) => {
    try {
      await dispatch(updateAppSettings(values));
      message.success(t('settingsUpdateSuccess'));
      trackEvent('App Settings Update');
    } catch (error) {
      message.error(t('settingsUpdateError'));
    }
  }, [dispatch, t]);

  const handleResetSettings = useCallback(async () => {
    try {
      await dispatch(resetAppSettings());
      message.success(t('settingsResetSuccess'));
      trackEvent('App Settings Reset');
    } catch (error) {
      message.error(t('settingsResetError'));
    }
  }, [dispatch, t]);

  const handleExportSettings = useCallback(async () => {
    try {
      const exportedSettings = await dispatch(exportAppSettings());
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportedSettings));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "app_settings.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      trackEvent('App Settings Export');
    } catch (error) {
      message.error(t('settingsExportError'));
    }
  }, [dispatch, t]);

  const handleImportSettings = useCallback(async () => {
    try {
      const importedSettings = JSON.parse(importData);
      await dispatch(importAppSettings(importedSettings));
      message.success(t('settingsImportSuccess'));
      setImportModalVisible(false);
      trackEvent('App Settings Import');
    } catch (error) {
      message.error(t('settingsImportError'));
    }
  }, [dispatch, t, importData]);

  const handleThemeChange = useCallback((isDark: boolean) => {
    dispatch(setTheme(isDark ? 'dark' : 'light'));
    trackEvent('Theme Change', { theme: isDark ? 'dark' : 'light' });
  }, [dispatch]);

  const handleLanguageChange = useCallback((language: string) => {
    i18n.changeLanguage(language);
    trackEvent('Language Change', { language });
  }, [i18n]);

  const debouncedSettingsUpdate = useCallback(
    debounce((changedValues, allValues) => {
      handleSettingsUpdate(allValues);
    }, 500),
    [handleSettingsUpdate]
  );

  const renderGeneralSettings = () => (
    <StyledForm form={form} onValuesChange={debouncedSettingsUpdate} layout="vertical">
      <Form.Item name="language" label={t('language')}>
        <Select onChange={handleLanguageChange}>
          <Option value="en">English</Option>
          <Option value="es">Español</Option>
          <Option value="fr">Français</Option>
          {/* Add more language options */}
        </Select>
      </Form.Item>
      <Form.Item name="darkMode" label={t('darkMode')} valuePropName="checked">
        <Switch onChange={handleThemeChange} />
      </Form.Item>
      <Form.Item name="fontSize" label={t('fontSize')}>
        <Slider min={12} max={24} step={1} />
      </Form.Item>
    </StyledForm>
  );

  const renderPerformanceSettings = () => (
    <StyledForm form={form} onValuesChange={debouncedSettingsUpdate} layout="vertical">
      <Form.Item name="enableAnimations" label={t('enableAnimations')} valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item name="dataRefreshInterval" label={t('dataRefreshInterval')}>
        <Select>
          <Option value={5000}>{t('5seconds')}</Option>
          <Option value={15000}>{t('15seconds')}</Option>
          <Option value={30000}>{t('30seconds')}</Option>
          <Option value={60000}>{t('1minute')}</Option>
        </Select>
      </Form.Item>
      <Form.Item name="maxItemsPerPage" label={t('maxItemsPerPage')}>
        <Slider min={10} max={100} step={10} />
      </Form.Item>
    </StyledForm>
  );

  const renderCustomizationSettings = () => (
    <StyledForm form={form} onValuesChange={debouncedSettingsUpdate} layout="vertical">
      <Form.Item name="primaryColor" label={t('primaryColor')}>
        <ColorPicker />
      </Form.Item>
      <Form.Item name="accentColor" label={t('accentColor')}>
        <ColorPicker />
      </Form.Item>
      <Form.Item name="customCss" label={t('customCss')}>
        <Input.TextArea rows={4} />
      </Form.Item>
    </StyledForm>
  );

  return (
    <SettingsContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('general')} key="general">
          {renderGeneralSettings()}
        </TabPane>
        <TabPane tab={t('performance')} key="performance">
          {renderPerformanceSettings()}
        </TabPane>
        <TabPane tab={t('customization')} key="customization">
          {renderCustomizationSettings()}
        </TabPane>
      </Tabs>
      <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <Button icon={<UndoOutlined />} onClick={handleResetSettings}>
          {t('resetToDefault')}
        </Button>
        <div>
          <Button icon={<ExportOutlined />} onClick={handleExportSettings} style={{ marginRight: '10px' }}>
            {t('exportSettings')}
          </Button>
          <Button icon={<ImportOutlined />} onClick={() => setImportModalVisible(true)}>
            {t('importSettings')}
          </Button>
        </div>
      </div>
      <Modal
        title={t('importSettings')}
        visible={importModalVisible}
        onOk={handleImportSettings}
        onCancel={() => setImportModalVisible(false)}
      >
        <Input.TextArea
          rows={4}
          value={importData}
          onChange={(e) => setImportData(e.target.value)}
          placeholder={t('pasteSettingsJsonHere')}
        />
      </Modal>
    </SettingsContainer>
  );
};

export default AppSettings;
