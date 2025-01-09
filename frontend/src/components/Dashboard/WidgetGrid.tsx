// src/components/Dashboard/WidgetGrid.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import styled from 'styled-components';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { updateWidgetLayouts } from '../../store/slices/dashboardSlice';
import { RootState, AppDispatch } from '../../store';
import { WidgetType, Layout } from '../../types/dashboard';
import DashboardWidget from './DashboardWidget';

const ResponsiveGridLayout = WidthProvider(Responsive);

const GridContainer = styled.div`
  .react-grid-item {
    background: ${props => props.theme.colors.widgetBackground};
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    transition: box-shadow 0.3s ease;

    &:hover {
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }
  }

  .react-resizable-handle {
    background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="6" height="6"%3E%3Cpath fill="%23999" d="M6 6H0V4.2h4.2V0H6z"/%3E%3C/svg%3E');
    background-position: bottom right;
    background-repeat: no-repeat;
    background-origin: content-box;
    box-sizing: border-box;
    cursor: se-resize;
  }
`;

interface WidgetGridProps {
  widgets: WidgetType[];
}

const WidgetGrid: React.FC<WidgetGridProps> = ({ widgets }) => {
  const dispatch = useDispatch<AppDispatch>();
  const savedLayouts = useSelector((state: RootState) => state.dashboard.layouts);
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');
  const [layouts, setLayouts] = useState<Layout>(savedLayouts);

  useEffect(() => {
    setLayouts(savedLayouts);
  }, [savedLayouts]);

  const onLayoutChange = useCallback((currentLayout: any, allLayouts: Layout) => {
    setLayouts(allLayouts);
    dispatch(updateWidgetLayouts(allLayouts));
  }, [dispatch]);

  const onBreakpointChange = useCallback((newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  }, []);

  return (
    <GridContainer>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={onLayoutChange}
        onBreakpointChange={onBreakpointChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        useCSSTransforms={true}
      >
        {widgets.map((widget) => (
          <div key={widget.id} data-grid={layouts[currentBreakpoint]?.find(item => item.i === widget.id)}>
            <DashboardWidget widget={widget} />
          </div>
        ))}
      </ResponsiveGridLayout>
    </GridContainer>
  );
};

export default React.memo(WidgetGrid);
