// src/components/Visualization/HeatMap.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Select, DatePicker, Slider, Switch, Spin, Tooltip, Button, Modal, Input, Radio, ColorPicker } from 'antd';
import { InfoCircleOutlined, SettingOutlined, DownloadOutlined, FullscreenOutlined, CompressOutlined } from '@ant-design/icons';
import moment from 'moment';
import { RootState, AppDispatch } from '../../store';
import { fetchHeatMapData, updateHeatMapSettings } from '../../store/slices/visualizationSlice';
import { HeatMapData, HeatMapCell } from '../../types/visualization';
import { exportToCSV } from '../../utils/exportUtils';
import { debounce } from 'lodash';
import * as d3 from 'd3';

const { Option } = Select;
const { RangePicker } = DatePicker;

const Container = styled.div<{ $fullscreen: boolean }>`
  display: flex;
  flex-direction: column;
  height: ${props => props.$fullscreen ? '100vh' : '100%'};
  width: ${props => props.$fullscreen ? '100vw' : '100%'};
  padding: 16px;
  background-color: ${props => props.theme.colors.widgetBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  position: ${props => props.$fullscreen ? 'fixed' : 'relative'};
  top: ${props => props.$fullscreen ? '0' : 'auto'};
  left: ${props => props.$fullscreen ? '0' : 'auto'};
  z-index: ${props => props.$fullscreen ? '9999' : 'auto'};
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

const HeatMap: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.visualization.heatMap);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedCell, setSelectedCell] = useState<HeatMapCell | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    dispatch(fetchHeatMapData());
  }, [dispatch]);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateHeatMapSettings({ [setting]: value }));
  }, [dispatch]);

  const debouncedHandleSettingChange = useMemo(
    () => debounce(handleSettingChange, 300),
    [handleSettingChange]
  );

  const handleExportData = useCallback(() => {
    if (data) {
      exportToCSV(data, 'heat_map_data.csv');
    }
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(cell => 
      moment(cell.date).isBetween(settings.dateRange[0], settings.dateRange[1], null, '[]')
    );
  }, [data, settings.dateRange]);

  const chartData = useMemo(() => {
    const groupedData: { [key: string]: { [key: string]: number } } = {};
    filteredData.forEach(cell => {
      if (!groupedData[cell.xAxis]) {
        groupedData[cell.xAxis] = {};
      }
      groupedData[cell.xAxis][cell.yAxis] = cell.value;
    });
    return Object.entries(groupedData).map(([xAxis, yValues]) => ({
      xAxis,
      ...yValues
    }));
  }, [filteredData]);

  const colorScale = useMemo(() => {
    const values = filteredData.map(cell => cell.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return d3.scaleSequential(d3[settings.colorScheme]).domain([min, max]);
  }, [filteredData, settings.colorScheme]);

  const handleCellClick = useCallback((cell: HeatMapCell) => {
    setSelectedCell(cell);
  }, []);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const renderHeatMap = () => (
    <ResponsiveHeatMap
      data={chartData}
      keys={[...new Set(filteredData.map(cell => cell.yAxis))]}
      indexBy="xAxis"
      margin={{ top: 60, right: 80, bottom: 60, left: 80 }}
      forceSquare={settings.forceSquare}
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
        legend: settings.xAxisLabel,
        legendPosition: 'middle',
        legendOffset: 46
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: settings.yAxisLabel,
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
      animate={settings.animate}
      motionStiffness={90}
      motionDamping={15}
      hoverTarget="cell"
      cellHoverOthersOpacity={0.25}
      onClick={handleCellClick}
      colors={{
        type: 'sequential',
        scheme: settings.colorScheme,
        minValue: Math.min(...filteredData.map(cell => cell.value)),
        maxValue: Math.max(...filteredData.map(cell => cell.value))
      }}
    />
  );

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container $fullscreen={isFullscreen}>
      <Header>
        <Title>
          Heat Map
          <Tooltip title="Visualize data intensity across two dimensions">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <RangePicker
            value={[moment(settings.dateRange[0]), moment(settings.dateRange[1])]}
            onChange={(dates) => handleSettingChange('dateRange', dates)}
          />
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>Export</Button>
          <Button icon={isFullscreen ? <CompressOutlined /> : <FullscreenOutlined />} onClick={toggleFullscreen} />
        </Controls>
      </Header>
      <ChartContainer>
        {renderHeatMap()}
      </ChartContainer>
      <Modal
        title="Heat Map Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <span>Force Square Cells:</span>
          <Switch
            checked={settings.forceSquare}
            onChange={(checked) => handleSettingChange('forceSquare', checked)}
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
          <span>Color Scheme:</span>
          <Select
            value={settings.colorScheme}
            onChange={(value) => handleSettingChange('colorScheme', value)}
            style={{ width: 120 }}
          >
            <Option value="interpolateYlOrRd">Yellow-Orange-Red</Option>
            <Option value="interpolateBlues">Blues</Option>
            <Option value="interpolateGreens">Greens</Option>
            <Option value="interpolatePurples">Purples</Option>
          </Select>
        </div>
        <div>
          <span>X-Axis Label:</span>
          <Input
            value={settings.xAxisLabel}
            onChange={(e) => handleSettingChange('xAxisLabel', e.target.value)}
          />
        </div>
        <div>
          <span>Y-Axis Label:</span>
          <Input
            value={settings.yAxisLabel}
            onChange={(e) => handleSettingChange('yAxisLabel', e.target.value)}
          />
        </div>
      </Modal>
      {selectedCell && (
        <Modal
          title="Cell Details"
          visible={!!selectedCell}
          onOk={() => setSelectedCell(null)}
          onCancel={() => setSelectedCell(null)}
        >
          <p>X-Axis: {selectedCell.xAxis}</p>
          <p>Y-Axis: {selectedCell.yAxis}</p>
          <p>Value: {selectedCell.value}</p>
          <p>Date: {moment(selectedCell.date).format('YYYY-MM-DD')}</p>
        </Modal>
      )}
    </Container>
  );
};

export default React.memo(HeatMap);
