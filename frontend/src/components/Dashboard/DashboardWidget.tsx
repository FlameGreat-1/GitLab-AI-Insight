// src/components/Dashboard/DashboardWidget.tsx

import React, { useMemo } from 'react';
import { useDrag } from 'react-dnd';
import styled from 'styled-components';
import { WidgetType } from '../../types/dashboard';
import NetworkAnalysis from '../Analytics/NetworkAnalysis';
import SentimentAnalysis from '../Analytics/SentimentAnalysis';
import CodeQualityPrediction from '../Analytics/CodeQualityPrediction';
import EnsembleModelResults from '../MachineLearning/EnsembleModelResults';
import AnomalyDetection from '../MachineLearning/AnomalyDetection';
import LiveUpdates from '../RealTime/LiveUpdates';

interface WidgetContainerProps {
  isDragging: boolean;
}

const WidgetContainer = styled.div<WidgetContainerProps>`
  height: 100%;
  padding: 16px;
  background-color: ${props => props.theme.colors.widgetBackground};
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  opacity: ${props => props.isDragging ? 0.6 : 1};
  
  &:hover {
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.15);
  }
`;

const WidgetTitle = styled.h3`
  font-size: 1.2rem;
  color: ${props => props.theme.colors.text};
  margin-bottom: 12px;
`;

const WidgetContent = styled.div`
  height: calc(100% - 40px);
  overflow: auto;
`;

interface DashboardWidgetProps {
  widget: WidgetType;
}

const DashboardWidget: React.FC<DashboardWidgetProps> = ({ widget }) => {
  const [{ isDragging }, drag] = useDrag({
    type: 'widget',
    item: { id: widget.id, type: widget.type },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });

  const renderWidgetContent = useMemo(() => {
    switch (widget.type) {
      case 'networkAnalysis':
        return <NetworkAnalysis data={widget.data} />;
      case 'sentimentAnalysis':
        return <SentimentAnalysis data={widget.data} />;
      case 'codeQualityPrediction':
        return <CodeQualityPrediction data={widget.data} />;
      case 'ensembleModelResults':
        return <EnsembleModelResults data={widget.data} />;
      case 'anomalyDetection':
        return <AnomalyDetection data={widget.data} />;
      case 'liveUpdates':
        return <LiveUpdates data={widget.data} />;
      default:
        return <div>Unknown widget type</div>;
    }
  }, [widget.type, widget.data]);

  return (
    <WidgetContainer ref={drag} isDragging={isDragging}>
      <WidgetTitle>{widget.title}</WidgetTitle>
      <WidgetContent>{renderWidgetContent}</WidgetContent>
    </WidgetContainer>
  );
};

export default React.memo(DashboardWidget);
