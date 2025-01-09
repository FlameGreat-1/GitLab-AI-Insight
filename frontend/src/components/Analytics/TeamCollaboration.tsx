// src/components/Analytics/TeamCollaboration.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveNetwork } from '@nivo/network';
import { ResponsiveCalendar } from '@nivo/calendar';
import { ResponsiveRadar } from '@nivo/radar';
import { Select, DatePicker, Spin, Tooltip, Button, Modal, Table, Tabs } from 'antd';
import { InfoCircleOutlined, TeamOutlined, CalendarOutlined, RadarChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import { RootState, AppDispatch } from '../../store';
import { fetchNetworkData, updateNetworkSettings } from '../../store/slices/analyticsSlice';
import { NetworkData, NetworkNode, NetworkLink } from '../../types/analytics';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';
import { exportToCSV } from '../../utils/exportUtils';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

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

const ChartContainer = styled.div`
  height: calc(100% - 100px);
  min-height: 400px;
`;

interface CalendarDataPoint {
  day: string;
  value: number;
}

interface RadarDataPoint {
  member: string;
  commits: number;
  reviews: number;
  issues: number;
  collaborations: number;
}

const TeamCollaboration: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { networkData, loading, error, timeRange, selectedMetric } = useSelector((state: RootState) => state.analytics);
  const [viewMode, setViewMode] = useState<'network' | 'calendar' | 'radar'>('network');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchNetworkData());
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: NetworkLink) => {
    console.log('Realtime update for team collaboration:', update);
    // Implement logic to update the collaboration data in real-time
  }, []);

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateNetworkSettings({ [setting]: value }));
  }, [dispatch]);

  const processedNetworkData = useMemo(() => {
    if (!networkData) return { nodes: [], links: [] };
    return {
      nodes: networkData.nodes.map((node: NetworkNode) => ({
        ...node,
        color: node.type === 'user' ? '#1f77b4' : '#2ca02c',
      })),
      links: networkData.links,
    };
  }, [networkData]);

  const calendarData = useMemo(() => {
    if (!networkData) return [];
    // Assuming networkData has a property 'dailyCollaborations'
    return networkData.dailyCollaborations?.map((day: { date: string; collaborationCount: number }) => ({
      day: day.date,
      value: day.collaborationCount,
    })) || [];
  }, [networkData]);

  const radarData = useMemo(() => {
    if (!networkData) return [];
    // Assuming networkData has a property 'members'
    return networkData.nodes
      .filter((node: NetworkNode) => node.type === 'user')
      .map((member: NetworkNode) => ({
        member: member.name,
        commits: member.metadata?.commits || 0,
        reviews: member.metadata?.reviews || 0,
        issues: member.metadata?.issues || 0,
        collaborations: member.metadata?.collaborations || 0,
      }));
  }, [networkData]);

  const handleExportData = useCallback(() => {
    if (networkData) {
      exportToCSV(networkData.links, 'team_collaboration_data.csv');
    }
  }, [networkData]);

  const renderChart = () => {
    switch (viewMode) {
      case 'network':
        return (
          <ResponsiveNetwork
            data={processedNetworkData}
            margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
            repulsivity={6}
            iterations={60}
            nodeColor={(node: any) => node.color}
            nodeBorderWidth={1}
            nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
            linkThickness={(link: any) => 2 * Math.sqrt(link.value)}
            linkBlendMode="multiply"
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'column',
                translateX: -100,
                itemWidth: 80,
                itemHeight: 14,
                itemOpacity: 0.75,
                symbolSize: 14,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
          />
        );
      case 'calendar':
        return (
          <ResponsiveCalendar
            data={calendarData}
            from={timeRange[0]}
            to={timeRange[1]}
            emptyColor="#eeeeee"
            colors={['#61cdbb', '#97e3d5', '#e8c1a0', '#f47560']}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
          />
        );
      case 'radar':
        return (
          <ResponsiveRadar
            data={radarData}
            keys={['commits', 'reviews', 'issues', 'collaborations']}
            indexBy="member"
            maxValue="auto"
            margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
            curve="linearClosed"
            borderWidth={2}
            borderColor={{ from: 'color' }}
            gridLevels={5}
            gridShape="circular"
            gridLabelOffset={36}
            enableDots={true}
            dotSize={10}
            dotColor={{ theme: 'background' }}
            dotBorderWidth={2}
            dotBorderColor={{ from: 'color' }}
            enableDotLabel={true}
            dotLabel="value"
            dotLabelYOffset={-12}
            colors={{ scheme: 'nivo' }}
            fillOpacity={0.25}
            blendMode="multiply"
            animate={true}
            isInteractive={true}
            legends={[
              {
                anchor: 'top-left',
                direction: 'column',
                translateX: -50,
                translateY: -40,
                itemWidth: 80,
                itemHeight: 20,
                itemTextColor: '#999',
                symbolSize: 12,
                symbolShape: 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemTextColor: '#000'
                    }
                  }
                ]
              }
            ]}
          />
        );
    }
  };

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Team Collaboration Analysis
          <Tooltip title="This component shows various aspects of team collaboration">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={selectedMetric}
            onChange={(value) => handleSettingChange('selectedMetric', value)}
            style={{ width: 120 }}
          >
            <Option value="all">All Metrics</Option>
            <Option value="commits">Commits</Option>
            <Option value="reviews">Reviews</Option>
            <Option value="issues">Issues</Option>
          </Select>
          <RangePicker
            value={[moment(timeRange[0]), moment(timeRange[1])]}
            onChange={(dates) => {
              if (dates && dates[0] && dates[1]) {
                handleSettingChange('timeRange', [dates[0].toISOString(), dates[1].toISOString()]);
              }
            }}
          />
          <Button.Group>
            <Button
              icon={<TeamOutlined />}
              onClick={() => setViewMode('network')}
              type={viewMode === 'network' ? 'primary' : 'default'}
            />
            <Button
              icon={<CalendarOutlined />}
              onClick={() => setViewMode('calendar')}
              type={viewMode === 'calendar' ? 'primary' : 'default'}
            />
            <Button
              icon={<RadarChartOutlined />}
              onClick={() => setViewMode('radar')}
              type={viewMode === 'radar' ? 'primary' : 'default'}
            />
          </Button.Group>
          <Button onClick={() => setModalVisible(true)}>Team Details</Button>
          <Button onClick={handleExportData}>Export CSV</Button>
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <Modal
        title="Team Collaboration Details"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Tabs defaultActiveKey="1">
          <TabPane tab="Team Members" key="1">
            <Table
              dataSource={networkData?.nodes.filter((node: NetworkNode) => node.type === 'user')}
              columns={[
                { title: 'Name', dataIndex: 'name', key: 'name' },
                { title: 'Role', dataIndex: ['metadata', 'role'], key: 'role' },
                { title: 'Commits', dataIndex: ['metadata', 'commits'], key: 'commits' },
                { title: 'Reviews', dataIndex: ['metadata', 'reviews'], key: 'reviews' },
                { title: 'Issues', dataIndex: ['metadata', 'issues'], key: 'issues' },
              ]}
            />
          </TabPane>
          <TabPane tab="Collaboration Strength" key="2">
            <Table
              dataSource={networkData?.links}
              columns={[
                { title: 'Source', dataIndex: 'source', key: 'source' },
                { title: 'Target', dataIndex: 'target', key: 'target' },
                { title: 'Strength', dataIndex: 'value', key: 'strength' },
              ]}
            />
          </TabPane>
        </Tabs>
      </Modal>
    </Container>
  );
};

export default React.memo(TeamCollaboration);
