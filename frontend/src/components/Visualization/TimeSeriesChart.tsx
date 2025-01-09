// src/components/Visualization/TimeSeriesChart.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveLine } from '@nivo/line';
import { ResponsiveBar } from '@nivo/bar';
import { Select, DatePicker, Slider, Switch, Spin, Tooltip, Button, Modal, Input, Radio } from 'antd';
import { InfoCircleOutlined, SettingOutlined, DownloadOutlined, LineChartOutlined, BarChartOutlined } from '@ant-design/icons';
import moment from 'moment';
import { RootState, AppDispatch } from '../../store';
import { fetchTimeSeriesData, updateTimeSeriesSettings } from '../../store/slices/visualizationSlice';
import { TimeSeriesData, DataPoint } from '../../types/visualization';
import { exportToCSV } from '../../utils/exportUtils';
import { debounce } from 'lodash';
import regression from 'regression';

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
  flex-grow: 1;
  min-height: 400px;
`;

const TimeSeriesChart: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.visualization.timeSeries);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedDataPoint, setSelectedDataPoint] = useState<DataPoint | null>(null);

  useEffect(() => {
    dispatch(fetchTimeSeriesData());
  }, [dispatch]);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateTimeSeriesSettings({ [setting]: value }));
  }, [dispatch]);

  const debouncedHandleSettingChange = useMemo(
    () => debounce(handleSettingChange, 300),
    [handleSettingChange]
  );

  const handleExportData = useCallback(() => {
    if (data) {
      exportToCSV(data, 'time_series_data.csv');
    }
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(point => 
      moment(point.date).isBetween(settings.dateRange[0], settings.dateRange[1], null, '[]') &&
      settings.selectedMetrics.includes(point.metric)
    );
  }, [data, settings.dateRange, settings.selectedMetrics]);

  const chartData = useMemo(() => {
    const groupedData = settings.selectedMetrics.map(metric => ({
      id: metric,
      data: filteredData
        .filter(point => point.metric === metric)
        .map(point => ({ x: point.date, y: point.value }))
    }));

    if (settings.showTrendline) {
      groupedData.forEach(series => {
        const regressionData = series.data.map((point, index) => [index, point.y]);
        const result = regression.linear(regressionData);
        const trendlineData = result.points.map((point, index) => ({
          x: series.data[index].x,
          y: point[1]
        }));
        groupedData.push({
          id: `${series.id} Trendline`,
          data: trendlineData
        });
      });
    }

    return groupedData;
  }, [filteredData, settings.selectedMetrics, settings.showTrendline]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 50, right: 110, bottom: 50, left: 60 },
      xScale: { type: 'time', format: '%Y-%m-%d' },
      xFormat: 'time:%Y-%m-%d',
      yScale: { type: 'linear', min: 'auto', max: 'auto', stacked: settings.stacked, reverse: false },
      axisTop: null,
      axisRight: null,
      axisBottom: {
        format: '%b %d',
        tickValues: 'every 7 days',
        legend: 'Date',
        legendOffset: 36,
        legendPosition: 'middle'
      },
      axisLeft: {
        legend: 'Value',
        legendOffset: -40,
        legendPosition: 'middle'
      },
      pointSize: 10,
      pointColor: { theme: 'background' },
      pointBorderWidth: 2,
      pointBorderColor: { from: 'serieColor' },
      pointLabelYOffset: -12,
      useMesh: true,
      legends: [
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
      ]
    };

    if (settings.chartType === 'line') {
      return (
        <ResponsiveLine
          {...commonProps}
          enableArea={settings.enableArea}
          areaOpacity={0.15}
          enableSlices="x"
          animate={settings.animate}
          motionStiffness={90}
          motionDamping={15}
          curve={settings.curve}
          onClick={(point) => setSelectedDataPoint(point.data)}
        />
      );
    } else {
      return (
        <ResponsiveBar
          {...commonProps}
          keys={settings.selectedMetrics}
          indexBy="date"
          padding={0.3}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          animate={settings.animate}
          motionStiffness={90}
          motionDamping={15}
          onClick={(point) => setSelectedDataPoint(point.data)}
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
          Time Series Chart
          <Tooltip title="Visualize time-based data trends">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            mode="multiple"
            style={{ width: 200 }}
            placeholder="Select metrics"
            value={settings.selectedMetrics}
            onChange={(value) => handleSettingChange('selectedMetrics', value)}
          >
            {data && [...new Set(data.map(point => point.metric))].map(metric => (
              <Option key={metric} value={metric}>{metric}</Option>
            ))}
          </Select>
          <RangePicker
            value={[moment(settings.dateRange[0]), moment(settings.dateRange[1])]}
            onChange={(dates) => handleSettingChange('dateRange', dates)}
          />
          <Radio.Group
            value={settings.chartType}
            onChange={(e) => handleSettingChange('chartType', e.target.value)}
          >
            <Radio.Button value="line"><LineChartOutlined /></Radio.Button>
            <Radio.Button value="bar"><BarChartOutlined /></Radio.Button>
          </Radio.Group>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>Export</Button>
        </Controls>
      </Header>
      <ChartContainer>
        {renderChart()}
      </ChartContainer>
      <Modal
        title="Time Series Chart Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <span>Stacked:</span>
          <Switch
            checked={settings.stacked}
            onChange={(checked) => handleSettingChange('stacked', checked)}
          />
        </div>
        <div>
          <span>Show Trendline:</span>
          <Switch
            checked={settings.showTrendline}
            onChange={(checked) => handleSettingChange('showTrendline', checked)}
          />
        </div>
        <div>
          <span>Enable Area (Line Chart):</span>
          <Switch
            checked={settings.enableArea}
            onChange={(checked) => handleSettingChange('enableArea', checked)}
          />
        </div>
        <div>
          <span>Animate:</span>
          <Switch
            checked={settings.animate}
            onChange={(checked) => handleSettingChange('animate', checked)}
          />
        </div>
        <div>
          <span>Curve Type (Line Chart):</span>
          <Select
            value={settings.curve}
            onChange={(value) => handleSettingChange('curve', value)}
            style={{ width: 120 }}
          >
            <Option value="linear">Linear</Option>
            <Option value="monotoneX">Monotone X</Option>
            <Option value="step">Step</Option>
            <Option value="stepAfter">Step After</Option>
            <Option value="stepBefore">Step Before</Option>
          </Select>
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(TimeSeriesChart);
