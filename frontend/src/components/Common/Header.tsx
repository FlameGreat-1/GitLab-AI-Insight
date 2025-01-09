// src/components/Common/Header.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled, { keyframes } from 'styled-components';
import { Input, Avatar, Dropdown, Menu, Badge, Button, Tooltip, Modal } from 'antd';
import { 
  BellOutlined, 
  SearchOutlined, 
  UserOutlined, 
  SettingOutlined, 
  LogoutOutlined,
  QuestionCircleOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { logout, updateUserPreferences } from '../../store/slices/authSlice';
import { fetchNotifications, markAllAsRead } from '../../store/slices/notificationSlice';
import { toggleTheme } from '../../store/slices/themeSlice';
import { NotificationItem } from '../../types/notification';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';

const { Search } = Input;

const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  height: 64px;
  background-color: ${props => props.theme.colors.headerBackground};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const SearchContainer = styled.div`
  width: 300px;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconButton = styled(Button)`
  color: ${props => props.theme.colors.text};
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const StyledBadge = styled(Badge)`
  .ant-badge-count {
    background-color: ${props => props.theme.colors.danger};
  }
`;

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(204,169,44, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(204,169,44, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(204,169,44, 0);
  }
`;

const PulsingAvatar = styled(Avatar)`
  animation: ${pulse} 2s infinite;
`;

const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const { notifications } = useSelector((state: RootState) => state.notifications);
  const { isDarkMode } = useSelector((state: RootState) => state.theme);
  const [searchVisible, setSearchVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isAuthenticated]);

  const handleSearch = useCallback((value: string) => {
    // Implement global search functionality
    console.log('Searching for:', value);
  }, []);

  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 300),
    [handleSearch]
  );

  const handleLogout = useCallback(() => {
    dispatch(logout());
  }, [dispatch]);

  const handleNotificationClick = useCallback((notification: NotificationItem) => {
    // Implement notification click functionality
    console.log('Clicked notification:', notification);
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  const handleThemeToggle = useCallback(() => {
    dispatch(toggleTheme());
  }, [dispatch]);

  const handleLanguageChange = useCallback((lang: string) => {
    i18n.changeLanguage(lang);
    dispatch(updateUserPreferences({ language: lang }));
  }, [dispatch, i18n]);

  const notificationMenu = (
    <Menu>
      {notifications.map(notification => (
        <Menu.Item key={notification.id} onClick={() => handleNotificationClick(notification)}>
          {notification.message}
        </Menu.Item>
      ))}
      <Menu.Divider />
      <Menu.Item onClick={handleMarkAllAsRead}>{t('markAllAsRead')}</Menu.Item>
    </Menu>
  );

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        {t('profile')}
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        {t('settings')}
      </Menu.Item>
      <Menu.SubMenu key="language" title={t('language')} icon={<GithubOutlined />}>
        <Menu.Item key="en" onClick={() => handleLanguageChange('en')}>English</Menu.Item>
        <Menu.Item key="es" onClick={() => handleLanguageChange('es')}>Español</Menu.Item>
        <Menu.Item key="fr" onClick={() => handleLanguageChange('fr')}>Français</Menu.Item>
      </Menu.SubMenu>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        {t('logout')}
      </Menu.Item>
    </Menu>
  );

  return (
    <HeaderContainer>
      <Logo>GitLab Insight AI</Logo>
      <SearchContainer>
        {searchVisible ? (
          <Search
            placeholder={t('search')}
            onSearch={handleSearch}
            onChange={(e) => debouncedSearch(e.target.value)}
          />
        ) : (
          <IconButton icon={<SearchOutlined />} onClick={() => setSearchVisible(true)} />
        )}
      </SearchContainer>
      <RightContainer>
        <Tooltip title={t('toggleTheme')}>
          <IconButton icon={isDarkMode ? '🌙' : '☀️'} onClick={handleThemeToggle} />
        </Tooltip>
        <Tooltip title={t('help')}>
          <IconButton icon={<QuestionCircleOutlined />} onClick={() => setHelpModalVisible(true)} />
        </Tooltip>
        <Dropdown overlay={notificationMenu} trigger={['click']}>
          <StyledBadge count={notifications.filter(n => !n.read).length}>
            <IconButton icon={<BellOutlined />} />
          </StyledBadge>
        </Dropdown>
        {isAuthenticated && (
          <Dropdown overlay={userMenu} trigger={['click']}>
            <PulsingAvatar src={user?.avatar} icon={<UserOutlined />} />
          </Dropdown>
        )}
      </RightContainer>
      <Modal
        title={t('helpCenter')}
        visible={helpModalVisible}
        onOk={() => setHelpModalVisible(false)}
        onCancel={() => setHelpModalVisible(false)}
        footer={null}
      >
        <p>{t('helpContent')}</p>
      </Modal>
    </HeaderContainer>
  );
};

export default React.memo(Header);
