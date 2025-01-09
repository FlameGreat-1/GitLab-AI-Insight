// src/components/Analytics/SentimentAnalysis.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Select, DatePicker, Spin, Tooltip, Button, Modal, Table } from 'antd';
import { InfoCircleOutlined, BarChartOutlined, HeatMapOutlined, TableOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { RootState, AppDispatch } from '../../store';
import { fetchSentimentData, updateSentimentSettings } from '../../store/slices/analyticsSlice';
import { SentimentEntry } from '../../types/analytics';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';
import { exportToCSV } from '../../utils/exportUtils';

dayjs.extend(isBetween);

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
  min-height: 400px;
`;

interface SentimentAnalysisProps {}

const SentimentAnalysis: React.FC<SentimentAnalysisProps> = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.analytics.sentimentAnalysis);
  const [viewMode, setViewMode] = useState<'line' | 'heatmap' | 'table'>('line');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchSentimentData());
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: SentimentEntry) => {
    console.log('Realtime update for sentiment analysis:', update);
    // Implement logic to update the sentiment data in real-time
  }, []);

  useWebSocket(WEBSOCKET_URL, handleRealtimeUpdate);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateSentimentSettings({ [setting]: value }));
  }, [dispatch]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((entry: SentimentEntry) => 
      dayjs(entry.date).isBetween(settings.dateRange[0], settings.dateRange[1], null, '[]') &&
      (settings.source === 'all' || entry.source === settings.source)
    );
  }, [data, settings]);

  const lineChartData = useMemo(() => {
    return [
      {
        id: 'Sentiment Score',
        data: filteredData.map((entry: SentimentEntry) => ({
          x: entry.date,
          y: entry.sentimentScore
        }))
      }
    ];
  }, [filteredData]);

  const heatMapData = useMemo(() => {
    const heatmap: { [key: string]: { [key: string]: number } } = {};
    filteredData.forEach((entry: SentimentEntry) => {
      const date = dayjs(entry.date).format('YYYY-MM-DD');
      const hour = dayjs(entry.date).format('HH');
      if (!heatmap[date]) heatmap[date] = {};
      heatmap[date][hour] = entry.sentimentScore;
    });
    return Object.entries(heatmap).map(([date, hours]) => ({
      id: date,
      data: Object.entries(hours).map(([hour, value]) => ({ x: hour, y: value }))
    }));
  }, [filteredData]);

  const handleExportData = useCallback(() => {
    exportToCSV(filteredData, 'sentiment_analysis_data.csv');
  }, [filteredData]);

  const renderChart = () => {
    switch (viewMode) {
      case 'line':
        return (
          <ResponsiveLine
            data={lineChartData}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: 'time', format: '%Y-%m-%d' }}
            xFormat="time:%Y-%m-%d"
            yScale={{ type: 'linear', min: -1, max: 1, stacked: false, reverse: false }}
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
              legend: 'Sentiment Score',
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
      case 'heatmap':
        return (
          <ResponsiveHeatMap
            data={heatMapData}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            valueFormat=">-.2f"
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
            colors={{
              type: 'diverging',
              scheme: 'red_yellow_blue',
              divergeAt: 0.5,
              minValue: -1,
              maxValue: 1
            }}
            emptyColor="#555555"
            legends={[
              {
                anchor: 'bottom',
                translateX: 0,
                translateY: 30,
                length: 400,
                thickness: 8,
                direction: 'row',
                tickPosition: 'after',
                tickSize: 3,
                tickSpacing: 4,
                tickOverlap: false,
                tickFormat: '>-.2f',
                title: 'Sentiment Score →',
                titleAlign: 'start',
                titleOffset: 4
              }
            ]}
          />
        );
      default:
        return null;
    }
  };

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Sentiment Analysis
          <Tooltip title="This chart shows the sentiment analysis of commit messages and comments">
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
            value={[dayjs(settings.dateRange[0]), dayjs(settings.dateRange[1])]}
            onChange={(dates) => {
              if (dates) {
                handleSettingChange('dateRange', [dates[0]?.toISOString(), dates[1]?.toISOString()]);
              }
            }}
          />
          <Button.Group>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setViewMode('line')}
              type={viewMode === 'line' ? 'primary' : 'default'}
            />
            <Button
              icon={<HeatMapOutlined />}
              onClick={() => setViewMode('heatmap')}
              type={viewMode === 'heatmap' ? 'primary' : 'default'}
            />
            <Button
              icon={<TableOutlined />}
              onClick={() => setModalVisible(true)}
              type={viewMode === 'table' ? 'primary' : 'default'}
            />
          </Button.Group>
          <Button onClick={handleExportData}>Export CSV</Button>
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <Modal
        title="Sentiment Analysis Data"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={800}
        footer={null}
      >
        <Table
          dataSource={filteredData}
          columns={[
            { title: 'Date', dataIndex: 'date', key: 'date' },
            { title: 'Source', dataIndex: 'source', key: 'source' },
            { title: 'Sentiment Score', dataIndex: 'sentimentScore', key: 'sentimentScore' },
            { title: 'Text', dataIndex: 'text', key: 'text', ellipsis: true },
          ]}
          scroll={{ y: 400 }}
        />
      </Modal>
    </Container>
  );
};

export default React.memo(SentimentAnalysis);
