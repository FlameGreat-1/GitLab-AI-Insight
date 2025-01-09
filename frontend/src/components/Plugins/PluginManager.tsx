// src/components/Plugins/PluginManager.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Table, Button, Input, Switch, Modal, Tabs, Tag, Tooltip, message, Popconfirm } from 'antd';
import { SearchOutlined, CloudDownloadOutlined, DeleteOutlined, SettingOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../../store/types';
import { 
  fetchPlugins, 
  installPlugin, 
  uninstallPlugin, 
  updatePluginSettings, 
  fetchAvailablePlugins 
} from '../../store/actions/pluginActions';
import { LoadingSpinner } from '../Common/LoadingSpinner';
import { Plugin, AvailablePlugin } from '../../types/plugin';
import { trackEvent } from '../../utils/analytics';

const { TabPane } = Tabs;

const PluginManagerContainer = styled(motion.div)`
  padding: 2rem;
  background: ${props => props.theme.colors.cardBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${props => props.theme.colors.tableHeaderBackground};
  }
`;

const SearchInput = styled(Input)`
  width: 300px;
  margin-bottom: 1rem;
`;

const PluginTag = styled(Tag)<{ $enabled: boolean }>`
  cursor: pointer;
  transition: all 0.3s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  opacity: ${props => props.$enabled ? 1 : 0.6};
`;

const PluginManager: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { plugins, availablePlugins, loading } = useSelector((state: RootState) => state.plugins);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('installed');

  useEffect(() => {
    dispatch(fetchPlugins());
    dispatch(fetchAvailablePlugins());
  }, [dispatch]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  const handleInstall = useCallback(async (plugin: AvailablePlugin) => {
    try {
      await dispatch(installPlugin(plugin.id));
      message.success(t('pluginInstallSuccess', { name: plugin.name }));
      trackEvent('Plugin Installed', { pluginId: plugin.id });
    } catch (error) {
      message.error(t('pluginInstallError', { name: plugin.name }));
    }
  }, [dispatch, t]);

  const handleUninstall = useCallback(async (pluginId: string) => {
    try {
      await dispatch(uninstallPlugin(pluginId));
      message.success(t('pluginUninstallSuccess'));
      trackEvent('Plugin Uninstalled', { pluginId });
    } catch (error) {
      message.error(t('pluginUninstallError'));
    }
  }, [dispatch, t]);

  const handleTogglePlugin = useCallback(async (plugin: Plugin, enabled: boolean) => {
    try {
      await dispatch(updatePluginSettings(plugin.id, { enabled }));
      message.success(t(enabled ? 'pluginEnabled' : 'pluginDisabled', { name: plugin.name }));
      trackEvent('Plugin Toggled', { pluginId: plugin.id, enabled });
    } catch (error) {
      message.error(t('pluginToggleError'));
    }
  }, [dispatch, t]);

  const handleSettingsClick = useCallback((plugin: Plugin) => {
    setSelectedPlugin(plugin);
    setSettingsModalVisible(true);
  }, []);

  const handleSettingsSave = useCallback(async (settings: any) => {
    if (selectedPlugin) {
      try {
        await dispatch(updatePluginSettings(selectedPlugin.id, settings));
        message.success(t('pluginSettingsUpdateSuccess'));
        setSettingsModalVisible(false);
        trackEvent('Plugin Settings Updated', { pluginId: selectedPlugin.id });
      } catch (error) {
        message.error(t('pluginSettingsUpdateError'));
      }
    }
  }, [dispatch, selectedPlugin, t]);

  const renderPluginSettings = () => {
    if (!selectedPlugin || !selectedPlugin.settingsSchema) return null;

    return (
      <div>
        {/* Render dynamic form based on plugin's settingsSchema */}
        {/* This is a placeholder and should be replaced with actual dynamic form rendering logic */}
        <pre>{JSON.stringify(selectedPlugin.settingsSchema, null, 2)}</pre>
      </div>
    );
  };

  const columns = [
    {
      title: t('pluginName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: Plugin, b: Plugin) => a.name.localeCompare(b.name),
    },
    {
      title: t('version'),
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: t('author'),
      dataIndex: 'author',
      key: 'author',
    },
    {
      title: t('status'),
      key: 'status',
      render: (plugin: Plugin) => (
        <Switch
          checked={plugin.enabled}
          onChange={(checked) => handleTogglePlugin(plugin, checked)}
        />
      ),
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (plugin: Plugin) => (
        <>
          <Tooltip title={t('pluginSettings')}>
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => handleSettingsClick(plugin)}
              style={{ marginRight: '8px' }}
            />
          </Tooltip>
          <Popconfirm
            title={t('confirmUninstall')}
            onConfirm={() => handleUninstall(plugin.id)}
            okText={t('yes')}
            cancelText={t('no')}
          >
            <Tooltip title={t('uninstallPlugin')}>
              <Button icon={<DeleteOutlined />} danger />
            </Tooltip>
          </Popconfirm>
        </>
      ),
    },
  ];

  const availablePluginsColumns = [
    {
      title: t('pluginName'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a: AvailablePlugin, b: AvailablePlugin) => a.name.localeCompare(b.name),
    },
    {
      title: t('description'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('version'),
      dataIndex: 'version',
      key: 'version',
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (plugin: AvailablePlugin) => (
        <Button 
          icon={<CloudDownloadOutlined />} 
          onClick={() => handleInstall(plugin)}
        >
          {t('install')}
        </Button>
      ),
    },
  ];

  const filteredPlugins = plugins.filter(plugin => 
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAvailablePlugins = availablePlugins.filter(plugin => 
    plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <PluginManagerContainer
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h1>{t('pluginManager')}</h1>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab={t('installedPlugins')} key="installed">
          <SearchInput
            prefix={<SearchOutlined />}
            placeholder={t('searchPlugins')}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <StyledTable 
            dataSource={filteredPlugins} 
            columns={columns} 
            loading={loading}
            rowKey="id"
          />
        </TabPane>
        <TabPane tab={t('availablePlugins')} key="available">
          <SearchInput
            prefix={<SearchOutlined />}
            placeholder={t('searchAvailablePlugins')}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <StyledTable 
            dataSource={filteredAvailablePlugins} 
            columns={availablePluginsColumns} 
            loading={loading}
            rowKey="id"
          />
        </TabPane>
      </Tabs>
      <Modal
        title={`${selectedPlugin?.name} ${t('settings')}`}
        visible={settingsModalVisible}
        onOk={handleSettingsSave}
        onCancel={() => setSettingsModalVisible(false)}
        width={800}
      >
        {renderPluginSettings()}
      </Modal>
    </PluginManagerContainer>
  );
};

export default PluginManager;
