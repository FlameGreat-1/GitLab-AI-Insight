// src/components/MachineLearning/FeatureImportance.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { Tooltip, Select, Switch, Spin } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { fetchFeatureImportance } from '../../store/slices/mlSlice';
import { RootState, AppDispatch } from '../../store';
import { FeatureImportanceData } from '../../types/ml';
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

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ChartContainer = styled.div`
  height: calc(100% - 60px);
`;

const FeatureImportance: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ml.featureImportance);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [viewType, setViewType] = useState<'bar' | 'treemap'>('bar');

  useEffect(() => {
    dispatch(fetchFeatureImportance());
  }, [dispatch]);

  useEffect(() => {
    if (data.length > 0 && !selectedModel) {
      setSelectedModel(data[0].modelName);
    }
  }, [data, selectedModel]);

  const handleRealtimeUpdate = (update: any) => {
    console.log('Realtime update for feature importance:', update);
    // Dispatch appropriate actions to update the state
  };

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const selectedModelData = useMemo(() => {
    return data.find(model => model.modelName === selectedModel);
  }, [data, selectedModel]);

  const chartData = useMemo(() => {
    if (!selectedModelData) return [];
    return selectedModelData.features.map(feature => ({
      feature: feature.name,
      importance: feature.importance,
    }));
  }, [selectedModelData]);

  const treeMapData = useMemo(() => {
    if (!selectedModelData) return { name: 'features', children: [] };
    return {
      name: 'features',
      children: selectedModelData.features.map(feature => ({
        name: feature.name,
        value: feature.importance,
      })),
    };
  }, [selectedModelData]);

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Feature Importance
          <Tooltip title="This chart shows the importance of each feature in the selected model">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
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
          <Switch
            checkedChildren="TreeMap"
            unCheckedChildren="Bar"
            checked={viewType === 'treemap'}
            onChange={(checked) => setViewType(checked ? 'treemap' : 'bar')}
          />
        </Controls>
      </Header>
      <ChartContainer>
        {viewType === 'bar' ? (
          <ResponsiveBar
            data={chartData}
            keys={['importance']}
            indexBy="feature"
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
              legend: 'Feature',
              legendPosition: 'middle',
              legendOffset: 40
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Importance',
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
        ) : (
          <ResponsiveTreeMap
            data={treeMapData}
            identity="name"
            value="value"
            valueFormat=".2f"
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            labelSkipSize={12}
            labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
            parentLabelPosition="left"
            parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
          />
        )}
      </ChartContainer>
    </Container>
  );
};

export default React.memo(FeatureImportance);
