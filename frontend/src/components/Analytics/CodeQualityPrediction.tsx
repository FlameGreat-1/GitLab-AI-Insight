// src/components/Analytics/CodeQualityPrediction.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Select, DatePicker, Spin, Tooltip, Button, Input, message } from 'antd';
import { InfoCircleOutlined, LineChartOutlined, BarChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import { RootState, AppDispatch } from '../../store';
import { fetchCodeQualityData, predictCodeQuality } from '../../store/slices/analyticsSlice';
import { CodeQualityData, CodeQualityPrediction } from '../../types/analytics';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';


const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

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
  height: calc(100% - 200px);
  min-height: 400px;
`;

const PredictionContainer = styled.div`
  margin-top: 16px;
  padding: 16px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 8px;
`;

interface ChartDataEntry {
  x: string;
  y: number;
}

interface BarChartDataEntry {
  date: string;
  [key: string]: string | number;
}

const CodeQualityPrediction: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.analytics.codeQuality);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([moment().subtract(30, 'days'), moment()]);
  const [metric, setMetric] = useState<string>('complexity');
  const [viewMode, setViewMode] = useState<'line' | 'bar'>('line');
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [prediction, setPrediction] = useState<CodeQualityPrediction | null>(null);

  useEffect(() => {
    dispatch(fetchCodeQualityData({ startDate: dateRange[0].toISOString(), endDate: dateRange[1].toISOString() }));
  }, [dispatch, dateRange]);
  
  const handleRealtimeUpdate = useCallback((update: CodeQualityData) => {
    console.log('Realtime update for code quality:', update);
    
  }, []);

  useWebSocket(WEBSOCKET_URL);

  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      const update: CodeQualityData = JSON.parse(event.data);
      handleRealtimeUpdate(update);
    };
  
    const socket = new WebSocket(WEBSOCKET_URL);
    socket.addEventListener('message', handleWebSocketMessage);
  
    return () => {
      socket.removeEventListener('message', handleWebSocketMessage);
      socket.close();
    };
  }, [handleRealtimeUpdate]);
  

  const handlePredict = useCallback(async () => {
    if (!codeSnippet.trim()) {
      message.error('Please enter a code snippet for prediction');
      return;
    }
    try {
      const result = await dispatch(predictCodeQuality(codeSnippet)).unwrap();
      setPrediction(result);
    } catch (err) {
      message.error('Failed to predict code quality');
    }
  }, [dispatch, codeSnippet]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return [
      {
        id: metric,
        data: data.map((entry: CodeQualityData) => ({
          x: entry.date,
          y: entry[metric as keyof CodeQualityData] as number
        }))
      }
    ];
  }, [data, metric]);

  const barChartData = useMemo(() => {
    if (!data) return [];
    return data.map((entry: CodeQualityData) => ({
      date: moment(entry.date).format('MMM DD'),
      [metric]: entry[metric as keyof CodeQualityData]
    }));
  }, [data, metric]);

  const renderChart = () => {
    if (viewMode === 'line') {
      return (
        <ResponsiveLine
          data={chartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'time', format: '%Y-%m-%d' }}
          xFormat="time:%Y-%m-%d"
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            format: '%b %d',
            tickValues: 'every 7 days',
            legend: 'Date',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            legend: metric.charAt(0).toUpperCase() + metric.slice(1),
            legendOffset: -40,
            legendPosition: 'middle'
          }}
          pointSize={10}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          pointLabelYOffset={-12}
          useMesh={true}
          legends={[
            {
              anchor: 'bottom-right',
              direction: 'column',
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: 'left-to-right',
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: 'circle',
              symbolBorderColor: 'rgba(0, 0, 0, .5)',
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemBackground: 'rgba(0, 0, 0, .03)',
                    itemOpacity: 1
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
          data={barChartData}
          keys={[metric]}
          indexBy="date"
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
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: 'Date',
            legendPosition: 'middle',
            legendOffset: 32
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: metric.charAt(0).toUpperCase() + metric.slice(1),
            legendPosition: 'middle',
            legendOffset: -40
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
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
          Code Quality Prediction
          <Tooltip title="This chart shows code quality metrics and predictions">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select value={metric} onChange={setMetric} style={{ width: 120 }}>
            <Option value="complexity">Complexity</Option>
            <Option value="maintainability">Maintainability</Option>
            <Option value="testCoverage">Test Coverage</Option>
          </Select>
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment])}
          />
          <Button.Group>
            <Button
              icon={<LineChartOutlined />}
              onClick={() => setViewMode('line')}
              type={viewMode === 'line' ? 'primary' : 'default'}
            />
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setViewMode('bar')}
              type={viewMode === 'bar' ? 'primary' : 'default'}
            />
          </Button.Group>
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <PredictionContainer>
        <TextArea
          rows={4}
          value={codeSnippet}
          onChange={(e) => setCodeSnippet(e.target.value)}
          placeholder="Enter code snippet for quality prediction"
        />
        <Button onClick={handlePredict} style={{ marginTop: 16 }}>Predict Quality</Button>
        {prediction && (
          <div style={{ marginTop: 16 }}>
            <h4>Prediction Results:</h4>
            <p>Complexity: {prediction.complexity}</p>
            <p>Maintainability: {prediction.maintainability}</p>
            <p>Test Coverage: {prediction.testCoverage}</p>
          </div>
        )}
      </PredictionContainer>
    </Container>
  );
};

export default React.memo(CodeQualityPrediction);
