// src/components/MachineLearning/ModelExplanation.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveNetwork } from '@nivo/network';
import { Tooltip, Select, Tabs, Input, Button, Spin, message } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import { fetchModelExplanation, explainPrediction } from '../../store/slices/mlSlice';
import { RootState, AppDispatch } from '../../store';
import { ModelExplanationData, ShapValues } from '../../types/ml';

const { Option } = Select;
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
  height: calc(100% - 150px);
`;

const InputContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const ModelExplanation: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error } = useSelector((state: RootState) => state.ml.modelExplanation);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [inputFeatures, setInputFeatures] = useState<string>('');
  const [explanationType, setExplanationType] = useState<'global' | 'local'>('global');

  useEffect(() => {
    dispatch(fetchModelExplanation());
  }, [dispatch]);

  useEffect(() => {
    if (data.models.length > 0 && !selectedModel) {
      setSelectedModel(data.models[0].name);
    }
  }, [data, selectedModel]);

  const selectedModelData = useMemo(() => {
    return data.models.find(model => model.name === selectedModel);
  }, [data, selectedModel]);

  const handleExplainPrediction = async () => {
    if (!inputFeatures) {
      message.error('Please input feature values');
      return;
    }
    try {
      const features = JSON.parse(inputFeatures);
      const result = await dispatch(explainPrediction({ modelName: selectedModel, features })).unwrap();
      // Handle the result, perhaps by updating the local state or Redux store
      console.log(result);
    } catch (err) {
      message.error('Failed to explain prediction. Please check your input.');
    }
  };

  const renderShapValues = (shapValues: ShapValues) => {
    const chartData = Object.entries(shapValues).map(([feature, value]) => ({
      feature,
      value: Math.abs(value),
      color: value > 0 ? '#2196f3' : '#ff0000'
    }));

    return (
      <ResponsiveBar
        data={chartData}
        keys={['value']}
        indexBy="feature"
        margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
        padding={0.3}
        colors={({ data }) => data.color}
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
          legend: 'SHAP Value',
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
  };

  const renderFeatureInteractions = (interactions: Record<string, Record<string, number>>) => {
    const nodes = Object.keys(interactions).map(feature => ({ id: feature }));
    const links = Object.entries(interactions).flatMap(([feature1, interacts]) => 
      Object.entries(interacts).map(([feature2, strength]) => ({
        source: feature1,
        target: feature2,
        strength
      }))
    );

    return (
      <ResponsiveNetwork
        nodes={nodes}
        links={links}
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        repulsivity={6}
        iterations={60}
        nodeColor={node => '#2196f3'}
        nodeBorderWidth={1}
        nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
        linkThickness={link => 2 * Math.sqrt(link.strength)}
        linkBlendMode="multiply"
        motionStiffness={160}
        motionDamping={12}
      />
    );
  };

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Model Explanation
          <Tooltip title="This component provides explanations for model predictions">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={selectedModel}
            onChange={setSelectedModel}
            style={{ width: 200 }}
          >
            {data.models.map((model) => (
              <Option key={model.name} value={model.name}>
                {model.name}
              </Option>
            ))}
          </Select>
        </Controls>
      </Header>
      <Tabs activeKey={explanationType} onChange={setExplanationType as (key: string) => void}>
        <TabPane tab="Global Explanation" key="global">
          <ChartContainer>
            {selectedModelData && renderShapValues(selectedModelData.globalShapValues)}
          </ChartContainer>
        </TabPane>
        <TabPane tab="Local Explanation" key="local">
          <InputContainer>
            <Input.TextArea 
              value={inputFeatures} 
              onChange={(e) => setInputFeatures(e.target.value)}
              placeholder="Enter feature values as JSON"
              rows={4}
            />
            <Button onClick={handleExplainPrediction}>Explain Prediction</Button>
          </InputContainer>
          <ChartContainer>
            {selectedModelData && selectedModelData.localExplanation && 
             renderShapValues(selectedModelData.localExplanation.shapValues)}
          </ChartContainer>
        </TabPane>
        <TabPane tab="Feature Interactions" key="interactions">
          <ChartContainer>
            {selectedModelData && renderFeatureInteractions(selectedModelData.featureInteractions)}
          </ChartContainer>
        </TabPane>
      </Tabs>
    </Container>
  );
};

export default React.memo(ModelExplanation);
