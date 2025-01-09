// src/components/Visualization/NetworkGraph.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { ForceGraph2D, ForceGraph3D, ForceGraphVR } from 'react-force-graph';
import { Select, Slider, Switch, Spin, Tooltip, Button, Modal, Input, ColorPicker } from 'antd';
import { InfoCircleOutlined, SettingOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import { RootState, AppDispatch } from '../../store';
import { fetchNetworkData, updateNetworkSettings } from '../../store/slices/visualizationSlice';
import { NetworkData, NetworkNode, NetworkLink } from '../../types/visualization';
import { exportToCSV } from '../../utils/exportUtils';
import { debounce } from 'lodash';

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

const GraphContainer = styled.div`
  flex-grow: 1;
  min-height: 500px;
`;

const NetworkGraph: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { data, loading, error, settings } = useSelector((state: RootState) => state.visualization.networkGraph);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [highlightLinks, setHighlightLinks] = useState(new Set());
  const [hoverNode, setHoverNode] = useState<NetworkNode | null>(null);

  useEffect(() => {
    dispatch(fetchNetworkData());
  }, [dispatch]);

  const handleSettingChange = useCallback((setting: string, value: any) => {
    dispatch(updateNetworkSettings({ [setting]: value }));
  }, [dispatch]);

  const debouncedHandleSettingChange = useMemo(
    () => debounce(handleSettingChange, 300),
    [handleSettingChange]
  );

  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
  }, []);

  const handleLinkClick = useCallback((link: NetworkLink) => {
    console.log('Link clicked:', link);
    // Implement link click behavior
  }, []);

  const handleExportData = useCallback(() => {
    if (data) {
      exportToCSV(data.nodes, 'network_nodes.csv');
      exportToCSV(data.links, 'network_links.csv');
    }
  }, [data]);

  const handleRefreshData = useCallback(() => {
    dispatch(fetchNetworkData());
  }, [dispatch]);

  const getNodeColor = useCallback((node: NetworkNode) => {
    if (hoverNode === node) return settings.hoverColor;
    if (selectedNode === node) return settings.selectedColor;
    return settings.nodeColor;
  }, [hoverNode, selectedNode, settings]);

  const getLinkColor = useCallback((link: NetworkLink) => {
    return highlightLinks.has(link) ? settings.highlightLinkColor : settings.linkColor;
  }, [highlightLinks, settings]);

  const getLinkWidth = useCallback((link: NetworkLink) => {
    return highlightLinks.has(link) ? 2 : 1;
  }, [highlightLinks]);

  const handleNodeHover = useCallback((node: NetworkNode | null) => {
    setHoverNode(node);
    setHighlightLinks(new Set(node ? data.links.filter(link => link.source === node || link.target === node) : []));
  }, [data]);

  const GraphComponent = useMemo(() => {
    switch (settings.dimension) {
      case '3d':
        return ForceGraph3D;
      case 'vr':
        return ForceGraphVR;
      default:
        return ForceGraph2D;
    }
  }, [settings.dimension]);

  if (loading) return <Spin size="large" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <Container>
      <Header>
        <Title>
          Network Graph
          <Tooltip title="Visualize network connections and relationships">
            <InfoCircleOutlined style={{ marginLeft: 8 }} />
          </Tooltip>
        </Title>
        <Controls>
          <Select
            value={settings.layout}
            onChange={(value) => handleSettingChange('layout', value)}
            style={{ width: 120 }}
          >
            <Option value="force">Force-Directed</Option>
            <Option value="radial">Radial</Option>
            <Option value="hierarchical">Hierarchical</Option>
          </Select>
          <Select
            value={settings.dimension}
            onChange={(value) => handleSettingChange('dimension', value)}
            style={{ width: 120 }}
          >
            <Option value="2d">2D</Option>
            <Option value="3d">3D</Option>
            <Option value="vr">VR</Option>
          </Select>
          <Button icon={<SettingOutlined />} onClick={() => setSettingsModalVisible(true)} />
          <Button icon={<DownloadOutlined />} onClick={handleExportData}>Export</Button>
          <Button icon={<ReloadOutlined />} onClick={handleRefreshData}>Refresh</Button>
        </Controls>
      </Header>
      <GraphContainer>
        <GraphComponent
          graphData={data}
          nodeColor={getNodeColor}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          nodeLabel={(node: NetworkNode) => `${node.id}: ${node.label}`}
          linkLabel={(link: NetworkLink) => `${link.source} → ${link.target}`}
          onNodeClick={handleNodeClick}
          onLinkClick={handleLinkClick}
          onNodeHover={handleNodeHover}
          linkDirectionalParticles={settings.showParticles ? 4 : 0}
          linkDirectionalParticleSpeed={0.001}
          d3AlphaDecay={0.01}
          d3VelocityDecay={0.08}
          warmupTicks={100}
          cooldownTicks={50}
          onEngineStop={() => console.log('Graph physics simulation has stopped')}
        />
      </GraphContainer>
      <Modal
        title="Network Graph Settings"
        visible={settingsModalVisible}
        onOk={() => setSettingsModalVisible(false)}
        onCancel={() => setSettingsModalVisible(false)}
      >
        <div>
          <span>Node Size:</span>
          <Slider
            min={1}
            max={20}
            value={settings.nodeSize}
            onChange={(value) => debouncedHandleSettingChange('nodeSize', value)}
          />
        </div>
        <div>
          <span>Link Strength:</span>
          <Slider
            min={0.1}
            max={2}
            step={0.1}
            value={settings.linkStrength}
            onChange={(value) => debouncedHandleSettingChange('linkStrength', value)}
          />
        </div>
        <div>
          <span>Charge Strength:</span>
          <Slider
            min={-1000}
            max={0}
            value={settings.chargeStrength}
            onChange={(value) => debouncedHandleSettingChange('chargeStrength', value)}
          />
        </div>
        <div>
          <span>Node Color:</span>
          <ColorPicker
            value={settings.nodeColor}
            onChange={(color) => handleSettingChange('nodeColor', color.toHexString())}
          />
        </div>
        <div>
          <span>Link Color:</span>
          <ColorPicker
            value={settings.linkColor}
            onChange={(color) => handleSettingChange('linkColor', color.toHexString())}
          />
        </div>
        <div>
          <span>Show Particles:</span>
          <Switch
            checked={settings.showParticles}
            onChange={(checked) => handleSettingChange('showParticles', checked)}
          />
        </div>
        <div>
          <span>Node Label Property:</span>
          <Input
            value={settings.nodeLabelProperty}
            onChange={(e) => handleSettingChange('nodeLabelProperty', e.target.value)}
          />
        </div>
      </Modal>
    </Container>
  );
};

export default React.memo(NetworkGraph);
