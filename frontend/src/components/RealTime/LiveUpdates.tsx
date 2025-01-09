// src/components/RealTime/LiveUpdates.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveBar } from '@nivo/bar';
import { Select, Switch, Spin, Tooltip, Button, Modal, List, Typography } from 'antd';
import { InfoCircleOutlined, BarChartOutlined, AreaChartOutlined, SettingOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchLiveUpdates, updateLiveUpdateSettings } from '../../store/slices/realTimeSlice';
import { LiveUpdateData, LiveUpdateEvent } from '../../types/realTime';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';

const { Option } = Select;
const { Text } = Typography;

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
  height: calc(100% - 150px);
  min-height: 400px;
`;

const EventList = styled(List)`
  max-height: 200px;
  overflow-y: auto;
  margin-top: 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 4px;
`;

const LiveUpdates: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.realTime.liveUpdates);
  const [viewMode, setViewMode] = useState<'stream' | 'bar'>('stream');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [recentEvents, setRecentEvents] = useState<LiveUpdateEvent[]>([]);

  useEffect(() => {
    dispatch(fetchLiveUpdates());
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: LiveUpdateEvent) => {
    console.log('Realtime update:', update);
    setRecentEvents(prev => [update, ...prev].slice(0, 10));
    // Dispatch action to update Redux store with new data
    dispatch(updateLiveUpdateSettings({ lastUpdate: update }));
  }, [dispatch]);

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateLiveUpdateSettings({ [setting]: value }));
  }, [dispatch]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      commits: item.commits,
      mergeRequests: item.mergeRequests,
      issues: item.issues,
    }));
  }, [data]);

  const renderChart = () => {
    if (viewMode === 'stream') {
      return (
        <ResponsiveStream
          data={chartData}
          keys={['commits', 'mergeRequests', 'issues']}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            orient: 'bottom',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Time',
            legendOffset: 36
          }}
          axisLeft={{
            orient: 'left',
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendOffset: -40
          }}
          offsetType="silhouette"
          colors={{ scheme: 'nivo' }}
          fillOpacity={0.85}
          borderColor={{ theme: 'background' }}
          defs={[
            {
              id: 'dots',
              type: 'patternDots',
              background: 'inherit',
              color: '#2c998f',
              size: 4,
              padding: 2,
              stagger: true
            },
            {
              id: 'squares',
              type: 'patternSquares',
              background: 'inherit',
              color: '#e4c912',
              size: 6,
              padding: 2,
              stagger: true
            }
          ]}
          fill={[
            { match: { id: 'commits' }, id: 'dots' },
            { match: { id: 'mergeRequests' }, id: 'squares' }
          ]}
          dotSize={8}
          dotColor={{ from: 'color' }}
          dotBorderWidth={2}
          dotBorderColor={{ from: 'color', modifiers: [['darker', 0.7]] }}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 100,
              itemWidth: 80,
              itemHeight: 20,
              itemTextColor: '#999999',
              symbolSize: 12,
              symbolShape: 'circle',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemTextColor: '#000000'
                  }
                }
              ]
            }
          ]}
        />
      );
    } else {
      return (
        <ResponsiveBar
          data={chartData}
          keys={['commits', 'mergeRequests', 'issues']}
          indexBy="timestamp"
          margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
          padding={0.3}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={{ scheme: 'nivo' }}
          defs={[
            {
              id: 'dots',
              type: 'patternDots',
              background: 'inherit',
              color: '#38bcb2',
              size: 4,
              padding: 1,
              stagger: true
            },
            {
              id: 'lines',
              type: 'patternLines',
              background: 'inherit',
              color: '#eed312',
              rotation: -45,
              lineWidth: 6,
              spacing: 10
            }
          ]}
          fill={[
            { match: { id: 'commits' }, id: 'dots' },
            { match: { id: 'mergeRequests' }, id: 'lines' }
          ]}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Time',
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Count',
            legendPosition: 'middle',
            legendOffset: -40
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          legends={[
            {
              dataFrom: 'keys',
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
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
          animate={true}
          motionStiffness={90}
          motionDamping={15}
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
          Live Updates
          <Tooltip title="This component shows real-time updates of GitLab activities">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={settings.updateFrequency}
            onChange={(value) => handleSettingChange('updateFrequency', value)}
            style={{ width: 120 }}
          >
            <Option value={1000}>1 second</Option>
            <Option value={5000}>5 seconds</Option>
            <Option value={10000}>10 seconds</Option>
          </Select>
          <Switch
            checkedChildren="Auto-update"
            unCheckedChildren="Manual"
            checked={settings.autoUpdate}
            onChange={(checked) => handleSettingChange('autoUpdate', checked)}
          />
          <Button.Group>
            <Button
              icon={<AreaChartOutlined />}
              onClick={() => setViewMode('stream')}
              type={viewMode === 'stream' ? 'primary' : 'default'}
            />
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setViewMode('bar')}
              type={viewMode === 'bar' ? 'primary' : 'default'}
            />
          </Button.Group>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <EventList
        header={<Text strong>Recent Events</Text>}
        dataSource={recentEvents}
        renderItem={(item: LiveUpdateEvent) => (
          <List.Item>
            <Text>{new Date(item.timestamp).toLocaleTimeString()}: {item.type} - {item.description}</Text>
          </List.Item>
        )}
      />
      <Modal
        title="Live Update Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <Text>Update Frequency:</Text>
          <Select
            value={settings.updateFrequency}
            onChange={(value) => handleSettingChange('updateFrequency', value)}
            style={{ width: 120, marginLeft: 8 }}
          >
            <Option value={1000}>1 second</Option>
            <Option value={5000}>5 seconds</Option>
            <Option value={10000}>10 seconds</Option>
          </Select>
        </div>
        <div style={{ marginTop: 16 }}>
          <Text>Auto-update:</Text>
          <Switch
            checked={settings.autoUpdate}
            onChange={(checked) => handleSettingChange('autoUpdate', checked)}
            style={{ marginLeft: 8 }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Text>Event Types to Show:</Text>
          <Select
            mode="multiple"
            style={{ width: '100%', marginTop: 8 }}
            placeholder="Select event types"
            value={settings.eventTypes}
            onChange={(value) => handleSettingChange('eventTypes', value)}
          >
            <Option value="commits">Commits</Option>
            <Option value="mergeRequests">Merge Requests</Option>
            <Option value="issues">Issues</Option>
          </Select>
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(LiveUpdates);
