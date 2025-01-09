// src/components/Common/Sidebar.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { Menu, Button, Tooltip, Badge, Drawer } from 'antd';
import { 
  DashboardOutlined, 
  ProjectOutlined, 
  TeamOutlined, 
  BarChartOutlined, 
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  RocketOutlined,
  BugOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { toggleSidebar, updateSidebarSettings } from '../../store/slices/uiSlice';
import { fetchUserProjects } from '../../store/slices/projectSlice';
import { Project } from '../../types/project';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

const { SubMenu } = Menu;

interface SidebarContainerProps {
  $collapsed: boolean;
}

const SidebarContainer = styled.aside<SidebarContainerProps>`
  position: fixed;
  left: 0;
  top: 64px;
  bottom: 0;
  width: ${props => props.$collapsed ? '80px' : '250px'};
  background-color: ${props => props.theme.colors.sidebarBackground};
  transition: all 0.3s ease;
  overflow-x: hidden;
  overflow-y: auto;
  z-index: 1000;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: ${props => props.theme.colors.scrollbarThumb};
    border-radius: 3px;
  }
`;

const CollapseButton = styled(Button)`
  position: absolute;
  right: -15px;
  top: 20px;
  z-index: 1001;
`;

const StyledMenu = styled(Menu)`
  border-right: none;
  background-color: transparent;
`;

const MenuItemContent = styled.div`
  display: flex;
  align-items: center;
`;

const MenuItemText = styled.span<{ $visible: boolean }>`
  margin-left: 10px;
  opacity: ${props => props.$visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ProjectBadge = styled(Badge)`
  .ant-badge-count {
    background-color: ${props => props.theme.colors.primary};
    box-shadow: none;
  }
`;

const QuickAccessDrawer = styled(Drawer)`
  .ant-drawer-body {
    padding: 0;
  }
`;

const QuickAccessButton = styled(Button)`
  position: fixed;
  bottom: 20px;
  left: ${props => props.theme.sidebar.collapsed ? '90px' : '260px'};
  transition: left 0.3s ease;
`;

const Sidebar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const { collapsed, settings } = useSelector((state: RootState) => state.ui.sidebar);
  const { projects } = useSelector((state: RootState) => state.projects);
  const [quickAccessVisible, setQuickAccessVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    dispatch(fetchUserProjects());
  }, [dispatch]);

  const handleToggleCollapse = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleMenuClick = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const handleQuickAccessToggle = useCallback(() => {
    setQuickAccessVisible(prev => !prev);
  }, []);

  const renderMenuItems = useMemo(() => {
    const items = [
      { key: 'dashboard', icon: <DashboardOutlined />, text: t('dashboard'), path: '/' },
      { key: 'projects', icon: <ProjectOutlined />, text: t('projects'), path: '/projects' },
      { key: 'team', icon: <TeamOutlined />, text: t('team'), path: '/team' },
      { key: 'analytics', icon: <BarChartOutlined />, text: t('analytics'), path: '/analytics' },
      { key: 'settings', icon: <SettingOutlined />, text: t('settings'), path: '/settings' },
    ];

    return items.map(item => (
      <Menu.Item key={item.key} onClick={() => handleMenuClick(item.path)}>
        <MenuItemContent>
          {item.icon}
          <MenuItemText $visible={!collapsed}>{item.text}</MenuItemText>
        </MenuItemContent>
      </Menu.Item>
    ));
  }, [collapsed, handleMenuClick, t]);

  const renderProjectSubmenu = useMemo(() => {
    return (
      <SubMenu 
        key="projects" 
        icon={<ProjectOutlined />} 
        title={t('recentProjects')}
      >
        {projects.slice(0, 5).map((project: Project) => (
          <Menu.Item key={`project-${project.id}`} onClick={() => handleMenuClick(`/projects/${project.id}`)}>
            <ProjectBadge count={project.unreadNotifications} size="small">
              {project.name}
            </ProjectBadge>
          </Menu.Item>
        ))}
      </SubMenu>
    );
  }, [projects, handleMenuClick, t]);

  const quickAccessItems = useMemo(() => [
    { key: 'cicd', icon: <RocketOutlined />, text: t('cicd'), path: '/cicd' },
    { key: 'issues', icon: <BugOutlined />, text: t('issues'), path: '/issues' },
    { key: 'api', icon: <ApiOutlined />, text: t('api'), path: '/api' },
  ], [t]);

  return (
    <>
      <SidebarContainer $collapsed={collapsed}>
        <CollapseButton 
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={handleToggleCollapse}
        />
        <StyledMenu
          mode="inline"
          theme={settings.theme}
          defaultSelectedKeys={['dashboard']}
          selectedKeys={[location.pathname.split('/')[1] || 'dashboard']}
          inlineCollapsed={collapsed}
        >
          {renderMenuItems}
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {renderProjectSubmenu}
              </motion.div>
            )}
          </AnimatePresence>
        </StyledMenu>
      </SidebarContainer>
      <QuickAccessButton
        type="primary"
        shape="circle"
        icon={<RocketOutlined />}
        onClick={handleQuickAccessToggle}
      />
      <QuickAccessDrawer
        title={t('quickAccess')}
        placement="left"
        closable={false}
        onClose={handleQuickAccessToggle}
        visible={quickAccessVisible}
        width={250}
      >
        <Menu mode="inline" theme={settings.theme}>
          {quickAccessItems.map(item => (
            <Menu.Item key={item.key} icon={item.icon} onClick={() => handleMenuClick(item.path)}>
              {item.text}
            </Menu.Item>
          ))}
        </Menu>
      </QuickAccessDrawer>
    </>
  );
};

export default React.memo(Sidebar);
