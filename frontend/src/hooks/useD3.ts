// src/hooks/useD3.ts

import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { debounce } from 'lodash';
import { useTranslation } from 'react-i18next';
import { message } from 'antd';
import { trackEvent } from '../utils/analytics';

interface D3RenderFunction<T> {
  (svg: d3.Selection<SVGSVGElement, unknown, null, undefined>, data: T, width: number, height: number): void;
}

interface UseD3Options<T> {
  data: T;
  render: D3RenderFunction<T>;
  dependencies?: any[];
  debounceTime?: number;
  animationDuration?: number;
  responsive?: boolean;
  onError?: (error: Error) => void;
}

export function useD3<T>({
  data,
  render,
  dependencies = [],
  debounceTime = 200,
  animationDuration = 750,
  responsive = true,
  onError
}: UseD3Options<T>) {
  const ref = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { t } = useTranslation();

  const updateDimensions = useCallback(() => {
    if (ref.current) {
      const { width, height } = ref.current.getBoundingClientRect();
      setDimensions({ width, height });
    }
  }, []);

  const debouncedUpdateDimensions = debounce(updateDimensions, debounceTime);

  useEffect(() => {
    updateDimensions();
    if (responsive) {
      window.addEventListener('resize', debouncedUpdateDimensions);
    }

    return () => {
      if (responsive) {
        window.removeEventListener('resize', debouncedUpdateDimensions);
      }
    };
  }, [responsive, debouncedUpdateDimensions]);

  useEffect(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      
      // Clear previous content
      svg.selectAll('*').remove();

      try {
        // Apply transition for smooth updates
        const transition = d3.transition().duration(animationDuration);

        // Call the render function with the SVG, data, and dimensions
        render(svg, data, dimensions.width, dimensions.height);

        // Apply the transition to all elements
        svg.selectAll('*').transition(transition);

        trackEvent('D3 Visualization Rendered', { type: render.name });
      } catch (error) {
        console.error('Error rendering D3 visualization:', error);
        message.error(t('d3RenderError'));
        if (onError) {
          onError(error as Error);
        }
        trackEvent('D3 Visualization Error', { type: render.name, error: (error as Error).message });
      }
    }
  }, [data, dimensions, render, animationDuration, t, onError, ...dependencies]);

  // Zoom functionality
  const enableZoom = useCallback(() => {
    if (ref.current) {
      const svg = d3.select(ref.current);
      const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
          svg.selectAll('g').attr('transform', event.transform);
        });

      svg.call(zoom as any);
    }
  }, []);

  // Export functionality
  const exportSVG = useCallback(() => {
    if (ref.current) {
      const svgData = ref.current.outerHTML;
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = svgUrl;
      downloadLink.download = 'd3_visualization.svg';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      trackEvent('D3 Visualization Exported', { type: render.name });
    }
  }, [render.name]);

  return {
    ref,
    width: dimensions.width,
    height: dimensions.height,
    enableZoom,
    exportSVG
  };
}
