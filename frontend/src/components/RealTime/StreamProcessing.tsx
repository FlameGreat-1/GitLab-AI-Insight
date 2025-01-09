// src/components/RealTime/StreamProcessing.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveSankey } from '@nivo/sankey';
import { Select, Switch, Spin, Tooltip, Button, Modal, Table, Typography, InputNumber } from 'antd';
import { InfoCircleOutlined, AreaChartOutlined, NodeIndexOutlined, SettingOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchStreamData, updateStreamSettings, processStreamData } from '../../store/slices/realTimeSlice';
import { StreamData, StreamNode, StreamLink } from '../../types/realTime';
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

const MetricsContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
`;

const Metric = styled.div`
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: ${props => props.theme.colors.primary};
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const StreamProcessing: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.realTime.streamProcessing);
  const [viewMode, setViewMode] = useState<'stream' | 'sankey'>('stream');
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchStreamData());
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: StreamData) => {
    console.log('Realtime stream update:', update);
    dispatch(processStreamData(update));
  }, [dispatch]);

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateStreamSettings({ [setting]: value }));
  }, [dispatch]);

  const streamData = useMemo(() => {
    if (!data) return [];
    return data.timeSeriesData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString(),
      ...item.values
    }));
  }, [data]);

  const sankeyData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };
    return {
      nodes: data.nodes,
      links: data.links
    };
  }, [data]);

  const renderChart = () => {
    if (viewMode === 'stream') {
      return (
        <ResponsiveStream
          data={streamData}
          keys={Object.keys(streamData[0] || {}).filter(key => key !== 'timestamp')}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
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
            legend: 'Value',
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
        <ResponsiveSankey
          data={sankeyData}
          margin={{ top: 40, right: 160, bottom: 40, left: 50 }}
          align="justify"
          colors={{ scheme: 'category10' }}
          nodeOpacity={1}
          nodeThickness={18}
          nodeInnerPadding={3}
          nodeSpacing={24}
          nodeBorderWidth={0}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkOpacity={0.5}
          linkHoverOthersOpacity={0.1}
          enableLinkGradient={true}
          labelPosition="outside"
          labelOrientation="vertical"
          labelPadding={16}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1]] }}
          animate={true}
          motionStiffness={140}
          motionDamping={11}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              translateX: 130,
              itemWidth: 100,
              itemHeight: 14,
              itemDirection: 'right-to-left',
              itemsSpacing: 2,
              itemTextColor: '#999',
              symbolSize: 14,
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
          Stream Processing
          <Tooltip title="This component shows real-time stream processing of GitLab data">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={settings.processingMode}
            onChange={(value) => handleSettingChange('processingMode', value)}
            style={{ width: 120 }}
          >
            <Option value="realtime">Real-time</Option>
            <Option value="batch">Batch</Option>
          </Select>
          <Switch
            checkedChildren="Auto-process"
            unCheckedChildren="Manual"
            checked={settings.autoProcess}
            onChange={(checked) => handleSettingChange('autoProcess', checked)}
          />
          <Button.Group>
            <Button
              icon={<AreaChartOutlined />}
              onClick={() => setViewMode('stream')}
              type={viewMode === 'stream' ? 'primary' : 'default'}
            />
            <Button
              icon={<NodeIndexOutlined />}
              onClick={() => setViewMode('sankey')}
              type={viewMode === 'sankey' ? 'primary' : 'default'}
            />
          </Button.Group>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <MetricsContainer>
        <Metric>
          <MetricValue>{data?.metrics.throughput.toFixed(2)}</MetricValue>
          <MetricLabel>Throughput (events/s)</MetricLabel>
        </Metric>
        <Metric>
          <MetricValue>{data?.metrics.latency.toFixed(2)}</MetricValue>
          <MetricLabel>Latency (ms)</MetricLabel>
        </Metric>
        <Metric>
          <MetricValue>{data?.metrics.errorRate.toFixed(2)}%</MetricValue>
          <MetricLabel>Error Rate</MetricLabel>
        </Metric>
      </MetricsContainer>
      <Modal
        title="Stream Processing Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <Text>Processing Mode:</Text>
          <Select
            value={settings.processingMode}
            onChange={(value) => handleSettingChange('processingMode', value)}
            style={{ width: 120, marginLeft: 8 }}
          >
            <Option value="realtime">Real-time</Option>
            <Option value="batch">Batch</Option>
          </Select>
        </div>
        <div style={{ marginTop: 16 }}>
          <Text>Auto-process:</Text>
          <Switch
            checked={settings.autoProcess}
            onChange={(checked) => handleSettingChange('autoProcess', checked)}
            style={{ marginLeft: 8 }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Text>Batch Size:</Text>
          <InputNumber
            min={1}
            max={1000}
            value={settings.batchSize}
            onChange={(value) => handleSettingChange('batchSize', value)}
            style={{ marginLeft: 8 }}
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <Text>Window Size (seconds):</Text>
          <InputNumber
            min={1}
            max={3600}
            value={settings.windowSize}
            onChange={(value) => handleSettingChange('windowSize', value)}
            style={{ marginLeft: 8 }}
          />
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(StreamProcessing);
