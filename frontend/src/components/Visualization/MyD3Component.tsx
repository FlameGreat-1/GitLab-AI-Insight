// src/components/Visualization/MyD3Component.tsx

import React from 'react';
import { useD3 } from '../../hooks/useD3';
import { Button } from 'antd';
import { ZoomInOutlined, ExportOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

interface MyD3ComponentProps {
  data: any; // Replace 'any' with your specific data type
}

const MyD3Component: React.FC<MyD3ComponentProps> = ({ data }) => {
  const { t } = useTranslation();
  const { ref, width, height, enableZoom, exportSVG } = useD3({
    data,
    render: (svg, data, width, height) => {
      // Your D3 rendering logic here
      // For example:
      svg.append('circle')
         .attr('cx', width / 2)
         .attr('cy', height / 2)
         .attr('r', Math.min(width, height) / 4)
         .attr('fill', 'blue');
    },
    responsive: true,
    animationDuration: 1000,
    onError: (error) => console.error('D3 rendering error:', error)
  });

  return (
    <div>
      <svg ref={ref} width={width} height={height} />
      <Button icon={<ZoomInOutlined />} onClick={enableZoom}>{t('enableZoom')}</Button>
      <Button icon={<ExportOutlined />} onClick={exportSVG}>{t('exportSVG')}</Button>
    </div>
  );
};

export default MyD3Component;
