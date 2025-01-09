// src/components/Visualization/SentimentGauge.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveArcGauge } from '@nivo/gauge';
import { Select, DatePicker, Slider, Switch, Spin, Tooltip, Button, Modal, Input, Radio } from 'antd';
import { InfoCircleOutlined, SettingOutlined, DownloadOutlined, HistoryOutlined } from '@ant-design/icons';
import moment from 'moment';
import { RootState, AppDispatch } from '../../store';
import { fetchSentimentData, updateSentimentSettings } from '../../store/slices/visualizationSlice';
import { SentimentData, SentimentTrend } from '../../types/visualization';
import { exportToCSV } from '../../utils/exportUtils';
import { debounce } from 'lodash';
import * as d3 from 'd3';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const { Option } = Select;
const { RangePicker } = DatePicker;

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

const GaugeContainer = styled.div`
  height: 300px;
`;

const TrendContainer = styled.div`
  height: 200px;
  margin-top: 20px;
`;

const SentimentScore = styled.div`
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  margin-top: 20px;
`;

const SentimentGauge: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.visualization.sentiment);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [trendModalVisible, setTrendModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchSentimentData());
  }, [dispatch]);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateSentimentSettings({ [setting]: value }));
  }, [dispatch]);

  const debouncedHandleSettingChange = useMemo(
    () => debounce(handleSettingChange, 300),
    [handleSettingChange]
  );

  const handleExportData = useCallback(() => {
    if (data) {
      exportToCSV(data.trends, 'sentiment_trend_data.csv');
    }
  }, [data]);

  const gaugeData = useMemo(() => {
    if (!data) return [];
    const { score } = data;
    return [
      {
        id: 'Sentiment',
        value: score,
        color: d3.interpolateRdYlGn((score + 1) / 2)
      }
    ];
  }, [data]);

  const trendData = useMemo(() => {
    if (!data) return [];
    return data.trends.map(trend => ({
      date: moment(trend.date).format('YYYY-MM-DD'),
      score: trend.score
    }));
  }, [data]);

  const renderGauge = () => (
    <ResponsiveArcGauge
      data={gaugeData}
      margin={{ top: 50, right: 20, bottom: 50, left: 20 }}
      min={-1}
      max={1}
      startAngle={-90}
      endAngle={90}
      cornerRadius={4}
      colors={{ scheme: 'red_yellow_green' }}
      arcThickness={0.15}
      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 3]] }}
      arcLabelsSkipAngle={10}
      arcLabelsTextXOffset={6}
      arcLabelsTextYOffset={-6}
      animate={settings.animate}
      motionStiffness={90}
      motionDamping={15}
    />
  );

  const renderTrendChart = () => (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis domain={[-1, 1]} />
        <RechartsTooltip />
        <Line type="monotone" dataKey="score" stroke="#8884d8" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Sentiment Gauge
          <Tooltip title="Visualize overall sentiment and trends">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={settings.source}
            onChange={(value) => handleSettingChange('source', value)}
            style={{ width: 120 }}
          >
            <Option value="all">All Sources</Option>
            <Option value="commits">Commits</Option>
            <Option value="issues">Issues</Option>
            <Option value="merge_requests">Merge Requests</Option>
          </Select>
          <RangePicker
            value={[moment(settings.dateRange[0]), moment(settings.dateRange[1])]}
            onChange={(dates) => handleSettingChange('dateRange', dates)}
          />
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
          <Button icon={<HistoryOutlined />} onClick={() => setTrendModalVisible(true)}>Trend</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>Export</Button>
        </Controls>
      </Header>
      <GaugeContainer>
        {renderGauge()}
      </GaugeContainer>
      <SentimentScore>
        Sentiment Score: {data?.score.toFixed(2)}
      </SentimentScore>
      <TrendContainer>
        {renderTrendChart()}
      </TrendContainer>
      <Modal
        title="Sentiment Gauge Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <span>Animate:</span>
          <Switch
            checked={settings.animate}
            onChange={(checked) => handleSettingChange('animate', checked)}
          />
        </div>
        <div>
          <span>Update Interval (seconds):</span>
          <Slider
            min={5}
            max={300}
            value={settings.updateInterval}
            onChange={(value) => debouncedHandleSettingChange('updateInterval', value)}
          />
        </div>
        <div>
          <span>Sentiment Threshold (Positive):</span>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={settings.positiveThreshold}
            onChange={(value) => debouncedHandleSettingChange('positiveThreshold', value)}
          />
        </div>
        <div>
          <span>Sentiment Threshold (Negative):</span>
          <Slider
            min={-1}
            max={0}
            step={0.1}
            value={settings.negativeThreshold}
            onChange={(value) => debouncedHandleSettingChange('negativeThreshold', value)}
          />
        </div>
      </Modal>
      <Modal
        title="Sentiment Trend"
        visible={trendModalVisible}
        onOk={() => setTrendModalVisible(false)}
        onCancel={() => setTrendModalVisible(false)}
        width={800}
      >
        <div style={{ height: 400 }}>
          {renderTrendChart()}
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(SentimentGauge);
