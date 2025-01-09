// src/pages/AnalyticsPage.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { Row, Col, Card, Select, DatePicker, Button, Tooltip, Table, Tag, Spin, message } from 'antd';
import { InfoCircleOutlined, DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { RootState, AppDispatch } from '../store/types';
import { fetchAnalyticsData, exportAnalyticsData } from '../store/actions/analyticsActions';
import { LoadingSpinner } from '../components/Common/LoadingSpinner';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { trackEvent } from '../utils/analytics';
import { formatNumber, formatDate } from '../utils/formatters';
import { debounce } from 'lodash';
import MyD3Component from '../components/Visualization/MyD3Component';

const { Option } = Select;
const { RangePicker } = DatePicker;

const AnalyticsContainer = styled(motion.div)`
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

const AnalyticsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation();
  const { data, loading, error } = useSelector((state: RootState) => state.analytics);
  const [dateRange, setDateRange] = useState<[moment.Moment, moment.Moment] | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['commits', 'mergeRequests']);
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    if (dateRange) {
      dispatch(fetchAnalyticsData({ dateRange, metrics: selectedMetrics, groupBy }));
    }
  }, [dispatch, dateRange, selectedMetrics, groupBy]);

  const handleDateRangeChange = useCallback((dates: [moment.Moment, moment.Moment] | null) => {
    setDateRange(dates);
    trackEvent('Analytics Date Range Changed', { range: dates ? `${dates[0].format('YYYY-MM-DD')} to ${dates[1].format('YYYY-MM-DD')}` : 'cleared' });
  }, []);

  const handleMetricsChange = useCallback((metrics: string[]) => {
    setSelectedMetrics(metrics);
    trackEvent('Analytics Metrics Changed', { metrics });
  }, []);

  const handleGroupByChange = useCallback((value: 'day' | 'week' | 'month') => {
    setGroupBy(value);
    trackEvent('Analytics Group By Changed', { groupBy: value });
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const exportData = await dispatch(exportAnalyticsData({ dateRange, metrics: selectedMetrics, groupBy })).unwrap();
      const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'analytics_export.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      trackEvent('Analytics Data Exported');
    } catch (error) {
      message.error(t('exportError'));
    }
  }, [dispatch, dateRange, selectedMetrics, groupBy, t]);

  const debouncedFetchData = useMemo(
    () => debounce(() => dispatch(fetchAnalyticsData({ dateRange, metrics: selectedMetrics, groupBy })), 300),
    [dispatch, dateRange, selectedMetrics, groupBy]
  );

  const renderLineChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.timeSeriesData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        {selectedMetrics.map((metric, index) => (
          <Line key={metric} type="monotone" dataKey={metric} stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  ), [data.timeSeriesData, selectedMetrics]);

  const renderBarChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data.contributorsData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <RechartsTooltip />
        <Legend />
        <Bar dataKey="commits" fill="#8884d8" />
        <Bar dataKey="mergeRequests" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  ), [data.contributorsData]);

  const renderPieChart = useMemo(() => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data.languageData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={100}
          fill="#8884d8"
          label
        />
        <RechartsTooltip />
      </PieChart>
    </ResponsiveContainer>
  ), [data.languageData]);

  const columns = [
    {
      title: t('repository'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: t('commits'),
      dataIndex: 'commits',
      key: 'commits',
      sorter: (a, b) => a.commits - b.commits,
      render: (commits: number) => formatNumber(commits),
    },
    {
      title: t('mergeRequests'),
      dataIndex: 'mergeRequests',
      key: 'mergeRequests',
      sorter: (a, b) => a.mergeRequests - b.mergeRequests,
      render: (mergeRequests: number) => formatNumber(mergeRequests),
    },
    {
      title: t('contributors'),
      dataIndex: 'contributors',
      key: 'contributors',
      sorter: (a, b) => a.contributors - b.contributors,
      render: (contributors: number) => formatNumber(contributors),
    },
    {
      title: t('lastUpdated'),
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      sorter: (a, b) => new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime(),
      render: (date: string) => formatDate(date),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) {
    message.error(t('analyticsLoadError'));
    return <div>{t('errorOccurred')}</div>;
  }

  return (
    <AnalyticsContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>{t('analytics')}</h1>
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col>
          <RangePicker onChange={handleDateRangeChange} />
        </Col>
        <Col>
          <Select
            mode="multiple"
            style={{ width: 200 }}
            placeholder={t('selectMetrics')}
            value={selectedMetrics}
            onChange={handleMetricsChange}
          >
            <Option value="commits">{t('commits')}</Option>
            <Option value="mergeRequests">{t('mergeRequests')}</Option>
            <Option value="issues">{t('issues')}</Option>
            <Option value="codeChurn">{t('codeChurn')}</Option>
          </Select>
        </Col>
        <Col>
          <Select value={groupBy} onChange={handleGroupByChange} style={{ width: 120 }}>
            <Option value="day">{t('daily')}</Option>
            <Option value="week">{t('weekly')}</Option>
            <Option value="month">{t('monthly')}</Option>
          </Select>
        </Col>
        <Col>
          <Tooltip title={t('refreshData')}>
            <Button icon={<SyncOutlined />} onClick={debouncedFetchData} />
          </Tooltip>
        </Col>
        <Col>
          <Tooltip title={t('exportData')}>
            <Button icon={<DownloadOutlined />} onClick={handleExport} />
          </Tooltip>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <ChartCard title={t('activityOverTime')}>
            {renderLineChart}
          </ChartCard>
        </Col>
        <div>
         <h1>Analytics</h1>
         <MyD3Component data={data} />
       </div>

        <Col span={12}>
          <ChartCard title={t('topContributors')}>
            {renderBarChart}
          </ChartCard>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <ChartCard title={t('languageDistribution')}>
            {renderPieChart}
          </ChartCard>
        </Col>
        <Col span={12}>
          <ChartCard title={t('repositoryInsights')}>
            <StyledTable 
              dataSource={data.repositoryData} 
              columns={columns} 
              pagination={{ pageSize: 5 }}
              scroll={{ y: 240 }}
            />
          </ChartCard>
        </Col>
      </Row>
    </AnalyticsContainer>
  );
};

export default AnalyticsPage;
