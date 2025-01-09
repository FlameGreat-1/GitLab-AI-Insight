// src/components/RealTime/NotificationSystem.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { List, Badge, Tag, Input, Select, Button, Modal, Switch, Tooltip, message } from 'antd';
import { BellOutlined, SettingOutlined, FilterOutlined, SoundOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchNotifications, updateNotificationSettings, markAsRead, clearAllNotifications } from '../../store/slices/notificationSlice';
import { Notification, NotificationPriority, NotificationCategory } from '../../types/notification';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';
import { playNotificationSound } from '../../utils/audio';

const { Search } = Input;
const { Option } = Select;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  background-color: ${props => props.theme.colors.widgetBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const Title = styled.h3`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text};
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const NotificationList = styled(List)`
  flex-grow: 1;
  overflow-y: auto;
`;

const NotificationItem = styled(List.Item)<{ $priority: NotificationPriority }>`
  background-color: ${props => 
    props.$priority === 'high' ? props.theme.colors.notificationHighPriority :
    props.$priority === 'medium' ? props.theme.colors.notificationMediumPriority :
    'transparent'};
  transition: background-color 0.3s ease;

  &:hover {
    background-color: ${props => props.theme.colors.notificationHover};
  }
`;

const CategoryTag = styled(Tag)`
  margin-right: 8px;
`;

const NotificationSystem: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { notifications, loading, error, settings } = useSelector((state: RootState) => state.notifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<NotificationPriority | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<NotificationCategory | 'all'>('all');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleRealtimeNotification = useCallback((notification: Notification) => {
    console.log('Realtime notification:', notification);
    dispatch(fetchNotifications()); // Refresh notifications
    if (settings.soundEnabled) {
      playNotificationSound(notification.priority);
    }
    message.info({
      content: `New notification: ${notification.message}`,
      duration: 3,
    });
  }, [dispatch, settings.soundEnabled]);

  useWebSocket(WEBSOCKET_URL, handleRealtimeNotification);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateNotificationSettings({ [setting]: value }));
  }, [dispatch]);

  const handleMarkAsRead = useCallback((id: string) => {
    dispatch(markAsRead(id));
  }, [dispatch]);

  const handleClearAll = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter(notification => 
      (searchTerm === '' || notification.message.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterPriority === 'all' || notification.priority === filterPriority) &&
      (filterCategory === 'all' || notification.category === filterCategory)
    );
  }, [notifications, searchTerm, filterPriority, filterCategory]);

  const renderNotificationItem = (item: Notification) => (
    <NotificationItem
      $priority={item.priority}
      actions={[
        <Button key="mark-read" onClick={() => handleMarkAsRead(item.id)}>Mark as Read</Button>
      ]}
    >
      <List.Item.Meta
        avatar={<Badge status={item.read ? 'default' : 'processing'} />}
        title={
          <>
            <CategoryTag color={getCategoryColor(item.category)}>{item.category}</CategoryTag>
            {item.message}
          </>
        }
        description={`${item.timestamp} - Priority: ${item.priority}`}
      />
    </NotificationItem>
  );

  const getCategoryColor = (category: NotificationCategory) => {
    switch (category) {
      case 'security': return 'red';
      case 'performance': return 'orange';
      case 'update': return 'green';
      case 'alert': return 'blue';
      default: return 'default';
    }
  };

  if (loading) return <div>Loading notifications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Notification Center
          <Tooltip title="Real-time notification system">
            <BellOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Search
            placeholder="Search notifications"
            onSearch={setSearchTerm}
            style={{ width: 200 }}
          />
          <Select
            value={filterPriority}
            onChange={setFilterPriority}
            style={{ width: 120 }}
          >
            <Option value="all">All Priorities</Option>
            <Option value="low">Low</Option>
            <Option value="medium">Medium</Option>
            <Option value="high">High</Option>
          </Select>
          <Select
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: 120 }}
          >
            <Option value="all">All Categories</Option>
            <Option value="security">Security</Option>
            <Option value="performance">Performance</Option>
            <Option value="update">Update</Option>
            <Option value="alert">Alert</Option>
          </Select>
          <Button icon={<FilterOutlined />} onClick={() => setFilterPriority('all')}>
            Clear Filters
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
        </Controls>
      </Header>
      <NotificationList
        dataSource={filteredNotifications}
        renderItem={renderNotificationItem}
        pagination={{
          onChange: page => {
            console.log(page);
          },
          pageSize: 10,
        }}
      />
      <Button onClick={handleClearAll} style={{ marginTop: 16 }}>Clear All Notifications</Button>
      <Modal
        title="Notification Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <Switch
            checked={settings.soundEnabled}
            onChange={(checked) => handleSettingChange('soundEnabled', checked)}
          />
          <span style={{ marginLeft: 8 }}>Enable Sound</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <Switch
            checked={settings.desktopNotifications}
            onChange={(checked) => handleSettingChange('desktopNotifications', checked)}
          />
          <span style={{ marginLeft: 8 }}>Enable Desktop Notifications</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <span>Notification Refresh Interval (seconds):</span>
          <Input
            type="number"
            value={settings.refreshInterval}
            onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
            style={{ width: 100, marginLeft: 8 }}
          />
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(NotificationSystem);
