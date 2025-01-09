// src/components/Dashboard/Dashboard.tsx

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Spin, message, Button, Row, Col, Drawer, Switch, Typography } from 'antd';
import { ReloadOutlined, SettingOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchDashboardData, updateWidgetVisibility, setWidgetLayout } from '../../store/slices/dashboardSlice';
import WidgetGrid from './WidgetGrid';
import ErrorBoundary from '../Common/ErrorBoundary';
import { WidgetType } from '../../types/dashboard';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';
import DateInfoComponent from '../Common/DateInfoComponent';
import { useTranslation } from 'react-i18next';
import { trackEvent } from '../../utils/analytics';

const { Title } = Typography;

const DashboardContainer = styled.div`
  padding: 20px;
  background-color: ${props => props.theme.colors.background};
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const DashboardTitle = styled(Title)`
  color: ${props => props.theme.colors.primary};
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`;

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { widgets, loading, error, layout } = useSelector((state: RootState) => state.dashboard);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchDashboardData());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchDashboardData()).unwrap();
      message.success(t('dashboardRefreshSuccess'));
      trackEvent('Dashboard Refreshed');
    } catch (err) {
      message.error(t('dashboardRefreshError'));
      trackEvent('Dashboard Refresh Error', { error: err });
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, t]);

  const handleWidgetVisibilityChange = useCallback((widgetId: string, isVisible: boolean) => {
    dispatch(updateWidgetVisibility({ widgetId, isVisible }));
    trackEvent('Widget Visibility Changed', { widgetId, isVisible });
  }, [dispatch]);

  const handleLayoutChange = useCallback((newLayout: any) => {
    dispatch(setWidgetLayout(newLayout));
    trackEvent('Dashboard Layout Changed');
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: any) => {
    console.log('Realtime update:', update);
    // Implement logic to update specific widgets based on the update
    // For example:
    // if (update.type === 'COMMIT_ADDED') {
    //   dispatch(updateCommitWidget(update.data));
    // }
  }, []);

  const { lastMessage } = useWebSocket(WEBSOCKET_URL, {
    onMessage: handleRealtimeUpdate,
    reconnectInterval: 3000,
    reconnectAttempts: 5,
  });

  useEffect(() => {
    if (lastMessage) {
      // Handle last message if needed
      console.log('Last WebSocket message:', lastMessage);
    }
  }, [lastMessage]);

  const visibleWidgets = useMemo(() => widgets.filter((widget: WidgetType) => widget.isVisible), [widgets]);

  if (loading && !isRefreshing) {
    return (
      <LoadingContainer>
        <Spin size="large" tip={t('loadingDashboard')} />
      </LoadingContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer>
        <DashboardHeader>
          <DashboardTitle level={2}>{t('dashboardTitle')}</DashboardTitle>
        </DashboardHeader>
        <ErrorBoundary>
          <div>{t('errorMessage')}: {error}</div>
          <Button onClick={handleRefresh} icon={<ReloadOutlined />}>
            {t('retry')}
          </Button>
        </ErrorBoundary>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <DashboardHeader>
        <DashboardTitle level={2}>{t('dashboardTitle')}</DashboardTitle>
        <div>
          <Button 
            onClick={handleRefresh} 
            icon={<ReloadOutlined />} 
            loading={isRefreshing}
            style={{ marginRight: 16 }}
          >
            {t('refresh')}
          </Button>
          <Button 
            onClick={() => setIsSettingsVisible(true)} 
            icon={<SettingOutlined />}
          >
            {t('settings')}
          </Button>
        </div>
      </DashboardHeader>
      <ErrorBoundary>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <DateInfoComponent />
          </Col>
        </Row>
        <WidgetGrid 
          widgets={visibleWidgets} 
          layout={layout}
          onLayoutChange={handleLayoutChange}
        />
      </ErrorBoundary>
      <Drawer
        title={t('dashboardSettings')}
        placement="right"
        closable={true}
        onClose={() => setIsSettingsVisible(false)}
        visible={isSettingsVisible}
      >
        {widgets.map((widget: WidgetType) => (
          <div key={widget.id} style={{ marginBottom: 16 }}>
            <Switch
              checked={widget.isVisible}
              onChange={(checked) => handleWidgetVisibilityChange(widget.id, checked)}
            />
            <span style={{ marginLeft: 8 }}>{widget.title}</span>
          </div>
        ))}
      </Drawer>
    </DashboardContainer>
  );
};

export default React.memo(Dashboard);
