// src/pages/MLInsightsPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Row, Col, Card, Select, DatePicker, Button, Tooltip, Table, Tag, Spin, message, Slider, Switch } from 'antd';
import { InfoCircleOutlined, ReloadOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store/types';
import { fetchMLInsights, updateMLModel } from '../store/actions/mlInsightsActions';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { 
  LineChart, Line, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ZAxis 
} from 'recharts';
import { trackEvent } from '../utils/analytics';
import { formatNumber, formatDate } from '../utils/formatters';
import { debounce } from 'lodash';

const { Option } = Select;
const { RangePicker } = DatePicker;

const InsightsContainer = styled(motion.div)`
  padding: 24px;
`;

const ChartCard = styled(Card)`
  margin-bottom: 24px;
  height: 400px;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    background: ${props => props.theme.colors.tableHeaderBackground};
  }
`;

const MLInsightsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { data, loading, error, modelInfo } = useSelector((state: RootState) => state.mlInsights);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('commitPrediction');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.7);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(false);

  useEffect(() => {
    if (dateRange) {
      dispatch(fetchMLInsights({ dateRange, model: selectedModel, confidenceThreshold }));
    }
  }, [dispatch, dateRange, selectedModel, confidenceThreshold]);

  const handleDateRangeChange = useCallback((dates: [moment.Moment, moment.Moment] | null) => {
    setDateRange(dates);
    trackEvent('ML Insights Date Range Changed', { range: dates ? `${dates[0].format('YYYY-MM-DD')} to ${dates[1].format('YYYY-MM-DD')}` : 'cleared' });
  }, []);

  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    trackEvent('ML Model Changed', { model });
  }, []);

  const handleConfidenceThresholdChange = useCallback((value: number) => {
    setConfidenceThreshold(value);
    trackEvent('Confidence Threshold Changed', { threshold: value });
  }, []);

  const handleModelUpdate = useCallback(async () => {
    try {
      await dispatch(updateMLModel(selectedModel)).unwrap();
      message.success(t('modelUpdateSuccess'));
      trackEvent('ML Model Updated', { model: selectedModel });
    } catch (error) {
      message.error(t('modelUpdateError'));
    }
  }, [dispatch, selectedModel, t]);

  const debouncedFetchInsights = useMemo(
    () => debounce(() => dispatch(fetchMLInsights({ dateRange, model: selectedModel, confidenceThreshold })), 300),
    [dispatch, dateRange, selectedModel, confidenceThreshold]
  );

  const renderCommitPredictionChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.commitPredictions}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        <Line type="monotone" dataKey="actual" stroke="#8884d8" name={t('actualCommits')} />
        <Line type="monotone" dataKey="predicted" stroke="#82ca9d" name={t('predictedCommits')} />
      </LineChart>
    </ResponsiveContainer>
  ), [data.commitPredictions, t]);

  const renderBugPredictionChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart>
        <CartesianGrid />
        <XAxis dataKey="complexity" name="Code Complexity" />
        <YAxis dataKey="changes" name="Number of Changes" />
        <ZAxis dataKey="bugProbability" range={[0, 500]} name="Bug Probability" />
        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
        <Legend />
        <Scatter name={t('files')} data={data.bugPredictions} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  ), [data.bugPredictions, t]);

  const renderDeveloperProductivityChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.developerProductivity}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="developer" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="productivity" fill="#82ca9d" name={t('productivityScore')} />
      </BarChart>
    </ResponsiveContainer>
  ), [data.developerProductivity, t]);

  const insightColumns = [
    {
      title: t('insight'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('confidence'),
      dataIndex: 'confidence',
      key: 'confidence',
      render: (confidence: number) => (
        <Tag color={confidence > 0.8 ? 'green' : confidence > 0.6 ? 'orange' : 'red'}>
          {(confidence * 100).toFixed(2)}%
        </Tag>
      ),
    },
    {
      title: t('impact'),
      dataIndex: 'impact',
      key: 'impact',
      render: (impact: string) => (
        <Tag color={impact === 'High' ? 'red' : impact === 'Medium' ? 'orange' : 'green'}>
          {impact}
        </Tag>
      ),
    },
    {
      title: t('recommendedAction'),
      dataIndex: 'recommendedAction',
      key: 'recommendedAction',
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) {
    message.error(t('mlInsightsLoadError'));
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <InsightsContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>{t('mlInsights')}</h1>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker onChange={handleDateRangeChange} />
        </Col>
        <Col>
          <Select value={selectedModel} onChange={handleModelChange} style={{ width: 200 }}>
            <Option value="commitPrediction">{t('commitPrediction')}</Option>
            <Option value="bugPrediction">{t('bugPrediction')}</Option>
            <Option value="developerProductivity">{t('developerProductivity')}</Option>
          </Select>
        </Col>
        <Col>
          <Tooltip title={t('refreshInsights')}>
            <Button icon={<ReloadOutlined />} onClick={debouncedFetchInsights} />
          </Tooltip>
        </Col>
        <Col>
          <Switch 
            checkedChildren={t('advanced')} 
            unCheckedChildren={t('basic')} 
            checked={showAdvancedOptions}
            onChange={setShowAdvancedOptions}
          />
        </Col>
      </Row>
      {showAdvancedOptions && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Tooltip title={t('confidenceThresholdHelp')}>
              <span>{t('confidenceThreshold')}: <InfoCircleOutlined /></span>
            </Tooltip>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={confidenceThreshold}
              onChange={handleConfidenceThresholdChange}
            />
          </Col>
          <Col span={12}>
            <Button onClick={handleModelUpdate}>{t('updateModel')}</Button>
            <Tooltip title={t('modelInfoHelp')}>
              <QuestionCircleOutlined style={{ marginLeft: 8 }} />
            </Tooltip>
            <p>{t('lastUpdated')}: {formatDate(modelInfo.lastUpdated)}</p>
            <p>{t('accuracy')}: {(modelInfo.accuracy * 100).toFixed(2)}%</p>
          </Col>
        </Row>
      )}
      <Row gutter={16}>
        <Col span={24}>
          <ChartCard title={t(selectedModel)}>
            {selectedModel === 'commitPrediction' && renderCommitPredictionChart}
            {selectedModel === 'bugPrediction' && renderBugPredictionChart}
            {selectedModel === 'developerProductivity' && renderDeveloperProductivityChart}
          </ChartCard>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Card title={t('keyInsights')}>
            <StyledTable 
              dataSource={data.insights} 
              columns={insightColumns} 
              pagination={{ pageSize: 5 }}
              scroll={{ y: 240 }}
            />
          </Card>
        </Col>
      </Row>
    </InsightsContainer>
  );
};

export default MLInsightsPage;
