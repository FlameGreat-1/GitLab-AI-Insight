// src/hooks/useWebSocket.ts

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import ReconnectingWebSocket from 'reconnecting-websocket';
import { trackEvent } from '../utils/analytics';

interface WebSocketOptions {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  reconnectDecay?: number;
  timeoutInterval?: number;
  maxRetries?: number;
  binaryType?: BinaryType;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

interface WebSocketState {
  socket: ReconnectingWebSocket | null;
  isConnected: boolean;
  lastMessage: any;
  connectionAttempts: number;
}

export const useWebSocket = (options: WebSocketOptions) => {
  const {
    url,
    protocols,
    reconnectInterval = 1000,
    reconnectDecay = 1.5,
    timeoutInterval = 2000,
    maxRetries = 5,
    binaryType = 'blob',
    onOpen,
    onClose,
    onMessage,
    onError,
  } = options;

  const [state, setState] = useState<WebSocketState>({
    socket: null,
    isConnected: false,
    lastMessage: null,
    connectionAttempts: 0,
  });

  const dispatch = useDispatch();
  const { t } = useTranslation();
  const socketRef = useRef<ReconnectingWebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    const socket = new ReconnectingWebSocket(url, protocols, {
      reconnectInterval,
      reconnectDecay,
      timeoutInterval,
      maxRetries,
    });

    socket.binaryType = binaryType;

    socket.onopen = (event: Event) => {
      setState(prev => ({ ...prev, isConnected: true, connectionAttempts: 0 }));
      message.success(t('websocketConnected'));
      trackEvent('WebSocket Connected', { url });
      if (onOpen) onOpen(event);
    };

    socket.onclose = (event: CloseEvent) => {
      setState(prev => ({ 
        ...prev, 
        isConnected: false, 
        connectionAttempts: prev.connectionAttempts + 1 
      }));
      message.warning(t('websocketDisconnected'));
      trackEvent('WebSocket Disconnected', { url, code: event.code, reason: event.reason });
      if (onClose) onClose(event);

      if (state.connectionAttempts >= maxRetries) {
        message.error(t('websocketMaxRetriesReached'));
        trackEvent('WebSocket Max Retries Reached', { url, attempts: state.connectionAttempts });
      } else {
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, reconnectInterval * Math.pow(reconnectDecay, state.connectionAttempts));
      }
    };

    socket.onmessage = (event: MessageEvent) => {
      setState(prev => ({ ...prev, lastMessage: event.data }));
      if (onMessage) onMessage(event);
    };

    socket.onerror = (event: Event) => {
      message.error(t('websocketError'));
      trackEvent('WebSocket Error', { url });
      if (onError) onError(event);
    };

    socketRef.current = socket;
    setState(prev => ({ ...prev, socket }));
  }, [url, protocols, reconnectInterval, reconnectDecay, timeoutInterval, maxRetries, binaryType, onOpen, onClose, onMessage, onError, t]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(data);
      trackEvent('WebSocket Message Sent', { url });
    } else {
      message.error(t('websocketNotConnected'));
    }
  }, [url, t]);

  const reconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.reconnect();
      trackEvent('WebSocket Manual Reconnect', { url });
    }
  }, [url]);

  return {
    ...state,
    sendMessage,
    reconnect,
  };
};
