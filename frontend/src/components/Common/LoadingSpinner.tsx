// src/components/Common/LoadingSpinner.tsx

import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  thickness?: number;
  speed?: number;
  text?: string;
  fullScreen?: boolean;
  customAnimation?: 'pulse' | 'bounce' | 'rotate';
}

const spinAnimation = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const pulseAnimation = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
`;

const bounceAnimation = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
`;

const getSize = (size: string) => {
  switch (size) {
    case 'small': return '30px';
    case 'large': return '80px';
    default: return '50px';
  }
};

const SpinnerContainer = styled.div<{ $fullScreen: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  ${props => props.$fullScreen && css`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  `}
`;

const Spinner = styled.div<SpinnerProps & { $customAnimation: string }>`
  width: ${props => getSize(props.size || 'medium')};
  height: ${props => getSize(props.size || 'medium')};
  border: ${props => props.thickness || 4}px solid ${props => props.color || props.theme.colors.primary};
  border-top: ${props => props.thickness || 4}px solid transparent;
  border-radius: 50%;
  animation: ${props => {
    switch (props.$customAnimation) {
      case 'pulse': return pulseAnimation;
      case 'bounce': return bounceAnimation;
      case 'rotate':
      default: return spinAnimation;
    }
  }} ${props => props.speed || 0.8}s linear infinite;
`;

const SpinnerText = styled(motion.p)`
  margin-top: 10px;
  font-size: 16px;
  color: ${props => props.theme.colors.text};
`;

const LoadingSpinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  color,
  thickness,
  speed,
  text,
  fullScreen = false,
  customAnimation = 'rotate'
}) => {
  const { t } = useTranslation();
  const theme = useSelector((state: RootState) => state.theme);
  const [dots, setDots] = useState('');

  const updateDots = useCallback(() => {
    setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
  }, []);

  useEffect(() => {
    const interval = setInterval(updateDots, 500);
    return () => clearInterval(interval);
  }, [updateDots]);

  return (
    <SpinnerContainer $fullScreen={fullScreen}>
      <Spinner
        size={size}
        color={color || theme.colors.primary}
        thickness={thickness}
        speed={speed}
        $customAnimation={customAnimation}
      />
      <AnimatePresence>
        {text && (
          <SpinnerText
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            {t(text)}{dots}
          </SpinnerText>
        )}
      </AnimatePresence>
    </SpinnerContainer>
  );
};

export default React.memo(LoadingSpinner);
