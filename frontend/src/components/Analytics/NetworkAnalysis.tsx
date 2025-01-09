// src/components/Analytics/NetworkAnalysis.tsx

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ResponsiveNetwork } from '@nivo/network';
import { Select, Slider, Switch, Spin, Tooltip, Button } from 'antd';
import { InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchNetworkData, updateNetworkSettings } from '../../store/slices/analyticsSlice';
import { NetworkData } from '../../types/analytics';
import { useWebSocket } from '../../hooks/useWebSocket';
import { WEBSOCKET_URL } from '../../config/constants';
import { saveAs } from 'file-saver';
import { ComputedNode, ComputedLink, InputNode as NivoInputNode, InputLink as NivoInputLink } from '@nivo/network';
import { MouseEvent } from 'react';

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
  height: calc(100% - 100px);
  min-height: 400px;
`;

interface InputNode extends NivoInputNode {
  id: string;
  connections: number;
  commits: number;
}

interface InputLink extends NivoInputLink {
  source: string;
  target: string;
  value: number;
}

const NetworkAnalysis: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.analytics.networkAnalysis);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchNetworkData() as any);
  }, [dispatch]);

  const handleRealtimeUpdate = useCallback((update: NetworkData) => {
    console.log('Realtime update for network analysis:', update);
  }, []);

  useWebSocket(WEBSOCKET_URL);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateNetworkSettings({ [setting]: value }));
  }, [dispatch]);

  const networkData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    const filteredNodes = data.nodes.filter((node: InputNode) => node.connections >= settings.minConnections);
    const nodeIds = new Set(filteredNodes.map((node: InputNode) => node.id));

    const filteredLinks = data.links.filter(
      (link: InputLink) => nodeIds.has(link.source) && nodeIds.has(link.target)
    );

    return { nodes: filteredNodes, links: filteredLinks };
  }, [data, settings.minConnections]);

  const handleNodeClick = useCallback((node: ComputedNode<NivoInputNode>, event: MouseEvent<Element, MouseEvent>) => {
    setHighlightedNode(node.id === highlightedNode ? null : node.id);
  }, [highlightedNode]);

  const getNodeColor = useCallback((node: NivoInputNode) => {
    const inputNode = node as InputNode;
    if (inputNode.id === highlightedNode) return '#ff5733';
    if (highlightedNode === null) return '#2196f3';
    return networkData.links.some(
      (link: InputLink) => (link.source === inputNode.id && link.target === highlightedNode) ||
              (link.target === inputNode.id && link.source === highlightedNode)
    ) ? '#4caf50' : '#9e9e9e';
  }, [highlightedNode, networkData]);

  const getLinkThickness = useCallback((link: ComputedLink<NivoInputNode, NivoInputLink>) => {
    return 2 * Math.sqrt((link.data as InputLink).value);
  }, []);

  const getLinkColor = useCallback((link: ComputedLink<NivoInputNode, NivoInputLink>) => {
    if (highlightedNode === null) return '#e0e0e0';
    return (link.source.id === highlightedNode || link.target.id === highlightedNode) ? '#4caf50' : '#e0e0e0';
  }, [highlightedNode]);

  const handleExportData = useCallback(() => {
    const jsonData = JSON.stringify(networkData, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    saveAs(blob, 'network_analysis_data.json');
  }, [networkData]);

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Developer Collaboration Network
          <Tooltip title="This network shows collaboration patterns between developers">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={settings.timeRange}
            onChange={(value) => handleSettingChange('timeRange', value)}
            style={{ width: 120 }}
          >
            <Option value="1w">1 Week</Option>
            <Option value="1m">1 Month</Option>
            <Option value="3m">3 Months</Option>
            <Option value="1y">1 Year</Option>
          </Select>
          <Tooltip title="Minimum number of connections for a developer to be shown">
            <Slider
              min={1}
              max={20}
              value={settings.minConnections}
              onChange={(value) => handleSettingChange('minConnections', value)}
              style={{ width: 120 }}
            />
          </Tooltip>
          <Switch
            checkedChildren="3D"
            unCheckedChildren="2D"
            checked={settings.is3D}
            onChange={(checked) => handleSettingChange('is3D', checked)}
          />
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>
            Export
          </Button>
        </Controls>
      </Header>
      <ChartContainer>
        <ResponsiveNetwork
          nodes={networkData.nodes}
          links={networkData.links}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
          repulsivity={6}
          iterations={60}
          nodeColor={getNodeColor}
          nodeBorderWidth={1}
          nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
          linkThickness={getLinkThickness}
          linkColor={getLinkColor}
          linkBlendMode="multiply"
          motionStiffness={160}
          motionDamping={12}
          onClick={handleNodeClick}
          tooltip={({ node }: { node: ComputedNode<NivoInputNode> }) => (
            <div
              style={{
                background: 'white',
                padding: '9px 12px',
                border: '1px solid #ccc',
              }}
            >
              <strong>{node.id}</strong>
              <br />
              Connections: {(node.data as InputNode).connections}
              <br />
              Commits: {(node.data as InputNode).commits}
            </div>
          )}
        />
      </ChartContainer>
    </Container>
  );
};

export default React.memo(NetworkAnalysis);
