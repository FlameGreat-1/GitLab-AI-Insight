// src/pages/HomePage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Row, Col, Card, Statistic, Button, Dropdown, Menu, Timeline, List, Avatar, Spin, message } from 'antd';
import { DashboardOutlined, TeamOutlined, RocketOutlined, BugOutlined, BarChartOutlined, MoreOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store/types';
import { fetchDashboardData, updateDashboardLayout } from '../store/actions/dashboardActions';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trackEvent } from '../utils/analytics';
import { formatNumber, formatDate } from '../utils/formatters';

const DashboardContainer = styled(motion.div)`
  padding: 24px;
`;

const DraggableCard = styled(Card)<{ isDragging: boolean }>`
  margin-bottom: 16px;
  transition: box-shadow 0.3s ease;
  ${props => props.isDragging && `
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  `}
`;

const StyledTimeline = styled(Timeline)`
  .ant-timeline-item-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
`;

const HomePage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { data, loading, error, layout } = useSelector((state: RootState) => state.dashboard);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    dispatch(fetchDashboardData(timeRange));
  }, [dispatch, timeRange]);

  const handleTimeRangeChange = useCallback((range: string) => {
    setTimeRange(range);
    trackEvent('Dashboard Time Range Changed', { range });
  }, []);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const newLayout = Array.from(layout);
    const [reorderedItem] = newLayout.splice(result.source.index, 1);
    newLayout.splice(result.destination.index, 0, reorderedItem);

    dispatch(updateDashboardLayout(newLayout));
    trackEvent('Dashboard Layout Changed');
  }, [dispatch, layout]);

  const renderActivityTimeline = () => (
    <StyledTimeline>
      {data.recentActivity.map((activity, index) => (
        <Timeline.Item key={index} color={activity.type === 'commit' ? 'green' : 'blue'}>
          <span>{activity.description}</span>
          <span>{formatDate(activity.timestamp)}</span>
        </Timeline.Item>
      ))}
    </StyledTimeline>
  );

  const renderTeamPerformance = () => (
    <List
      itemLayout="horizontal"
      dataSource={data.teamPerformance}
      renderItem={item => (
        <List.Item>
          <List.Item.Meta
            avatar={<Avatar src={item.avatar} />}
            title={item.name}
            description={`Commits: ${item.commits}, PRs: ${item.pullRequests}`}
          />
          <div>{item.score}</div>
        </List.Item>
      )}
    />
  );

  const renderProjectHealth = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.projectHealth}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderCard = (item: string) => {
    switch (item) {
      case 'summary':
        return (
          <Card title={t('summary')}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic title={t('totalProjects')} value={formatNumber(data.summary.totalProjects)} prefix={<DashboardOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title={t('activeUsers')} value={formatNumber(data.summary.activeUsers)} prefix={<TeamOutlined />} />
              </Col>
              <Col span={8}>
                <Statistic title={t('deployments')} value={formatNumber(data.summary.deployments)} prefix={<RocketOutlined />} />
              </Col>
            </Row>
          </Card>
        );
      case 'activity':
        return (
          <Card 
            title={t('recentActivity')}
            extra={
              <Dropdown overlay={
                <Menu onClick={({key}) => handleTimeRangeChange(key as string)}>
                  <Menu.Item key="1d">{t('last24Hours')}</Menu.Item>
                  <Menu.Item key="7d">{t('last7Days')}</Menu.Item>
                  <Menu.Item key="30d">{t('last30Days')}</Menu.Item>
                </Menu>
              }>
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            }
          >
            {renderActivityTimeline()}
          </Card>
        );
      case 'performance':
        return (
          <Card title={t('teamPerformance')}>
            {renderTeamPerformance()}
          </Card>
        );
      case 'health':
        return (
          <Card title={t('projectHealth')}>
            {renderProjectHealth()}
          </Card>
        );
      default:
        return null;
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    message.error(t('dashboardLoadError'));
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <DashboardContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>{t('dashboard')}</h1>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef}>
              <AnimatePresence>
                {layout.map((item, index) => (
                  <Draggable key={item} draggableId={item} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ duration: 0.3 }}
                      >
                        <DraggableCard isDragging={snapshot.isDragging}>
                          {renderCard(item)}
                        </DraggableCard>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </DashboardContainer>
  );
};

export default HomePage;
