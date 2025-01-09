// src/components/MachineLearning/EnsembleModelResults.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Tooltip, Select, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { fetchEnsembleModelResults } from '../../store/slices/mlSlice';
import { RootState, AppDispatch } from '../../store';
import { EnsembleModelResult } from '../../types/ml';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';

const { Option } = Select;

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

const ChartContainer = styled.div`
  height: calc(100% - 100px);
  display: flex;
  flex-direction: column;
`;

const ModelPerformance = styled.div`
  display: flex;
  justify-content: space-around;
  margin-top: 16px;
`;

const PerformanceMetric = styled.div`
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

const EnsembleModelResults: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ml.ensembleModelResults);
  const [selectedModel, setSelectedModel] = useState<string>('');

  useEffect(() => {
    dispatch(fetchEnsembleModelResults());
  }, [dispatch]);

  useEffect(() => {
    if (data.length > 0 && !selectedModel) {
      setSelectedModel(data[0].modelName);
    }
  }, [data, selectedModel]);

  const handleRealtimeUpdate = (update: any) => {
    // Handle realtime updates for ensemble model results
    console.log('Realtime update for ensemble model:', update);
    // Dispatch appropriate actions to update the state
  };

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const selectedModelData = useMemo(() => {
    return data.find(model => model.modelName === selectedModel);
  }, [data, selectedModel]);

  const lineChartData = useMemo(() => {
    if (!selectedModelData) return [];
    return [
      {
        id: 'Accuracy',
        data: selectedModelData.performanceOverTime.map((point) => ({
          x: point.timestamp,
          y: point.accuracy,
        })),
      },
      {
        id: 'F1 Score',
        data: selectedModelData.performanceOverTime.map((point) => ({
          x: point.timestamp,
          y: point.f1Score,
        })),
      },
    ];
  }, [selectedModelData]);

  const barChartData = useMemo(() => {
    if (!selectedModelData) return [];
    return selectedModelData.featureImportance.map((feature) => ({
      feature: feature.name,
      importance: feature.importance,
    }));
  }, [selectedModelData]);

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Ensemble Model Results
          <Tooltip title="This chart shows the performance of our ensemble model over time">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Select
          value={selectedModel}
          onChange={setSelectedModel}
          style={{ width: 200 }}
        >
          {data.map((model) => (
            <Option key={model.modelName} value={model.modelName}>
              {model.modelName}
            </Option>
          ))}
        </Select>
      </Header>
      <ChartContainer>
        <ResponsiveLine
          data={lineChartData}
          margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
          xScale={{ type: 'time', format: '%Y-%m-%d' }}
          xFormat="time:%Y-%m-%d"
          yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            format: '%b %d',
            tickValues: 'every 2 days',
            legend: 'Date',
            legendOffset: 36,
            legendPosition: 'middle'
          }}
          axisLeft={{
            legend: 'Score',
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
      </ChartContainer>
      <ModelPerformance>
        <PerformanceMetric>
          <MetricValue>{selectedModelData?.currentPerformance.accuracy.toFixed(2)}</MetricValue>
          <MetricLabel>Accuracy</MetricLabel>
        </PerformanceMetric>
        <PerformanceMetric>
          <MetricValue>{selectedModelData?.currentPerformance.f1Score.toFixed(2)}</MetricValue>
          <MetricLabel>F1 Score</MetricLabel>
        </PerformanceMetric>
        <PerformanceMetric>
          <MetricValue>{selectedModelData?.currentPerformance.precision.toFixed(2)}</MetricValue>
          <MetricLabel>Precision</MetricLabel>
        </PerformanceMetric>
        <PerformanceMetric>
          <MetricValue>{selectedModelData?.currentPerformance.recall.toFixed(2)}</MetricValue>
          <MetricLabel>Recall</MetricLabel>
        </PerformanceMetric>
      </ModelPerformance>
    </Container>
  );
};

export default React.memo(EnsembleModelResults);
