import { io, Socket } from 'socket.io-client';
import { api } from './api';

class WebSocketClient {
  private socket: Socket | null = null;
  private isConnecting = false;

  connect(): Socket | null {
    if (typeof window === 'undefined') return null;

    const token = api.getToken();
    if (!token) {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.isConnecting && this.socket) {
      return this.socket;
    }

    this.isConnecting = true;
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3007';

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnecting = false;
      // Socket conectado exitosamente
    });

    this.socket.on('connect_error', () => {
      this.isConnecting = false;
    });

    this.socket.on('disconnect', () => {
      this.isConnecting = false;
    });

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnecting = false;
    }
  }

  getSocket(): Socket | null {
    return this.socket || this.connect();
  }

  on(event: string, callback: (...args: unknown[]) => void): () => void {
    const s = this.getSocket();
    if (!s) return () => {};

    const listener = (...args: unknown[]) => {
      callback(...args);
    };

    s.on(event, listener);
    return () => {
      s.off(event, listener);
    };
  }
}

export const wsClient = new WebSocketClient();
