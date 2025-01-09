// src/components/MachineLearning/AnomalyDetection.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Tooltip, Select, Switch, Spin, DatePicker } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';
import { fetchAnomalyData } from '../../store/slices/mlSlice';
import { RootState, AppDispatch } from '../../store';
import { AnomalyData, AnomalyPoint } from '../../types/ml';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';

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

const ChartContainer = styled.div`
  height: calc(100% - 100px);
`;

const AnomalyDetection: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ml.anomalyDetection);
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [viewType, setViewType] = useState<'scatter' | 'heatmap'>('scatter');
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment]>([moment().subtract(7, 'days'), moment()]);

  useEffect(() => {
    dispatch(fetchAnomalyData(dateRange[0].toISOString(), dateRange[1].toISOString()));
  }, [dispatch, dateRange]);

  useEffect(() => {
    if (data.metrics.length > 0 && !selectedMetric) {
      setSelectedMetric(data.metrics[0]);
    }
  }, [data, selectedMetric]);

  const handleRealtimeUpdate = useCallback((update: AnomalyPoint) => {
    console.log('Realtime update for anomaly detection:', update);
    // Dispatch appropriate actions to update the state
    // This could involve adding the new point to the existing data
    // and potentially triggering a re-render of the chart
  }, []);

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const chartData = useMemo(() => {
    if (!data.anomalies || !selectedMetric) return [];
    return data.anomalies
      .filter(anomaly => anomaly.metric === selectedMetric)
      .map(anomaly => ({
        x: new Date(anomaly.timestamp),
        y: anomaly.value,
        isAnomaly: anomaly.isAnomaly,
      }));
  }, [data, selectedMetric]);

  const heatmapData = useMemo(() => {
    if (!data.anomalies || !selectedMetric) return [];
    const heatmap: { [key: string]: { [key: string]: number } } = {};
    data.anomalies
      .filter(anomaly => anomaly.metric === selectedMetric)
      .forEach(anomaly => {
        const date = moment(anomaly.timestamp).format('YYYY-MM-DD');
        const hour = moment(anomaly.timestamp).format('HH');
        if (!heatmap[date]) heatmap[date] = {};
        heatmap[date][hour] = (heatmap[date][hour] || 0) + (anomaly.isAnomaly ? 1 : 0);
      });
    return Object.entries(heatmap).map(([date, hours]) => ({
      date,
      ...hours,
    }));
  }, [data, selectedMetric]);

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Anomaly Detection
          <Tooltip title="This chart shows detected anomalies in GitLab activities">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={selectedMetric}
            onChange={setSelectedMetric}
            style={{ width: 200 }}
          >
            {data.metrics.map((metric) => (
              <Option key={metric} value={metric}>
                {metric}
              </Option>
            ))}
          </Select>
          <Switch
            checkedChildren="Heatmap"
            unCheckedChildren="Scatter"
            checked={viewType === 'heatmap'}
            onChange={(checked) => setViewType(checked ? 'heatmap' : 'scatter')}
          />
          <RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates as [moment.Moment, moment.Moment])}
          />
        </Controls>
      </Header>
      <ChartContainer>
        {viewType === 'scatter' ? (
          <ResponsiveScatterPlot
            data={[{ id: selectedMetric, data: chartData }]}
            margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
            xScale={{ type: 'time', format: '%Y-%m-%d' }}
            xFormat="time:%Y-%m-%d"
            yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
            blendMode="multiply"
            axisTop={null}
            axisRight={null}
            axisBottom={{
              format: '%b %d',
              tickValues: 'every 2 days',
              legend: 'Date',
              legendOffset: 46,
              legendPosition: 'middle'
            }}
            axisLeft={{
              legend: 'Value',
              legendOffset: -60,
              legendPosition: 'middle'
            }}
            colors={(d) => d.data.isAnomaly ? '#ff0000' : '#2196f3'}
            tooltip={({ node }) => (
              <div
                style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                }}
              >
                <strong>
                  {node.data.isAnomaly ? 'Anomaly' : 'Normal'}: {node.data.y}
                </strong>
                <br />
                {moment(node.data.x).format('YYYY-MM-DD HH:mm:ss')}
              </div>
            )}
          />
        ) : (
          <ResponsiveHeatMap
            data={heatmapData}
            keys={[...Array(24).keys()].map(h => h.toString().padStart(2, '0'))}
            indexBy="date"
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            forceSquare={true}
            axisTop={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -90,
              legend: '',
              legendOffset: 46
            }}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -90,
              legend: 'Date',
              legendPosition: 'middle',
              legendOffset: 46
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Hour',
              legendPosition: 'middle',
              legendOffset: -72
            }}
            cellOpacity={1}
            cellBorderColor={{ from: 'color', modifiers: [['darker', 0.4]] }}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
            defs={[
              {
                id: 'lines',
                type: 'patternLines',
                background: 'inherit',
                color: 'rgba(0, 0, 0, 0.1)',
                rotation: -45,
                lineWidth: 4,
                spacing: 7
              }
            ]}
            fill={[{ id: 'lines' }]}
            animate={true}
            motionStiffness={80}
            motionDamping={9}
            hoverTarget="cell"
            cellHoverOthersOpacity={0.25}
          />
        )}
      </ChartContainer>
    </Container>
  );
};

export default React.memo(AnomalyDetection);
