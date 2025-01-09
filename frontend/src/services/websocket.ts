// src/services/websocket.ts

import ReconnectingWebSocket from 'reconnecting-websocket';
import { store } from '../store';
import { addNotification } from '../store/actions/notificationActions';
import { updateProjectStatus } from '../store/actions/projectActions';
import { updatePipelineStatus } from '../store/actions/pipelineActions';
import { updateMergeRequestStatus } from '../store/actions/mergeRequestActions';
import { trackEvent } from '../utils/analytics';
import { decryptMessage, encryptMessage } from '../utils/encryption';

type MessageHandler = (data: any) => void;

class WebSocketService {
  private static instance: WebSocketService;
  private socket: ReconnectingWebSocket | null = null;
  private messageHandlers: { [key: string]: MessageHandler[] } = {};
  private url: string;
  private reconnectInterval: number;
  private reconnectDecay: number;
  private timeoutInterval: number;
  private maxRetries: number;

  private constructor() {
    this.url = process.env.REACT_APP_WEBSOCKET_URL || 'wss://api.example.com/ws';
    this.reconnectInterval = 1000;
    this.reconnectDecay = 1.5;
    this.timeoutInterval = 2000;
    this.maxRetries = 5;
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public connect(token: string): void {
    if (this.socket) {
      this.socket.close();
    }

    this.socket = new ReconnectingWebSocket(
      `${this.url}?token=${token}`,
      [],
      {
        reconnectInterval: this.reconnectInterval,
        reconnectDecay: this.reconnectDecay,
        timeoutInterval: this.timeoutInterval,
        maxRetries: this.maxRetries,
      }
    );

    this.socket.onopen = this.onOpen.bind(this);
    this.socket.onmessage = this.onMessage.bind(this);
    this.socket.onclose = this.onClose.bind(this);
    this.socket.onerror = this.onError.bind(this);
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  public send(type: string, data: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, data });
      const encryptedMessage = encryptMessage(message);
      this.socket.send(encryptedMessage);
    } else {
      console.error('WebSocket is not connected.');
    }
  }

  public on(type: string, handler: MessageHandler): void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(handler);
  }

  public off(type: string, handler: MessageHandler): void {
    if (this.messageHandlers[type]) {
      this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
    }
  }

  private onOpen(event: Event): void {
    console.log('WebSocket connected');
    trackEvent('WebSocket Connected');
    store.dispatch(addNotification({ type: 'success', message: 'Real-time connection established' }));
  }

  private onMessage(event: MessageEvent): void {
    const decryptedMessage = decryptMessage(event.data);
    const message = JSON.parse(decryptedMessage);

    if (this.messageHandlers[message.type]) {
      this.messageHandlers[message.type].forEach(handler => handler(message.data));
    }

    // Handle specific message types
    switch (message.type) {
      case 'PROJECT_UPDATE':
        store.dispatch(updateProjectStatus(message.data));
        break;
      case 'PIPELINE_UPDATE':
        store.dispatch(updatePipelineStatus(message.data));
        break;
      case 'MERGE_REQUEST_UPDATE':
        store.dispatch(updateMergeRequestStatus(message.data));
        break;
      case 'NOTIFICATION':
        store.dispatch(addNotification(message.data));
        break;
      default:
        console.log('Unhandled message type:', message.type);
    }
  }

  private onClose(event: CloseEvent): void {
    console.log('WebSocket disconnected:', event.reason);
    trackEvent('WebSocket Disconnected', { reason: event.reason });
    store.dispatch(addNotification({ type: 'warning', message: 'Real-time connection lost. Reconnecting...' }));
  }

  private onError(event: Event): void {
    console.error('WebSocket error:', event);
    trackEvent('WebSocket Error');
    store.dispatch(addNotification({ type: 'error', message: 'Error in real-time connection' }));
  }

  // Advanced features
  public setReconnectInterval(interval: number): void {
    this.reconnectInterval = interval;
    if (this.socket) {
      (this.socket as any).reconnectInterval = interval;
    }
  }

  public setMaxRetries(retries: number): void {
    this.maxRetries = retries;
    if (this.socket) {
      (this.socket as any).maxRetries = retries;
    }
  }

  public getStatus(): string {
    if (!this.socket) return 'CLOSED';
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return 'CONNECTING';
      case WebSocket.OPEN: return 'OPEN';
      case WebSocket.CLOSING: return 'CLOSING';
      case WebSocket.CLOSED: return 'CLOSED';
      default: return 'UNKNOWN';
    }
  }

  public forceReconnect(): void {
    if (this.socket) {
      this.socket.reconnect();
    }
  }
}

export const websocketService = WebSocketService.getInstance();
