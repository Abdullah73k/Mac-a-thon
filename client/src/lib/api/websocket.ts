/**
 * WebSocket manager for real-time communication.
 *
 * Handles connection lifecycle, reconnection with exponential backoff,
 * and typed message dispatching.
 */

type MessageHandler = (message: unknown) => void;

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:3000";
const MAX_RECONNECT_ATTEMPTS = 8;
const INITIAL_RECONNECT_DELAY_MS = 1000;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Set<MessageHandler>();
  private url: string;
  private shouldReconnect = true;

  constructor(path: string) {
    this.url = `${WS_BASE_URL}${path}`;
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.reconnectDelay = INITIAL_RECONNECT_DELAY_MS;
    };

    this.ws.onclose = () => {
      if (this.shouldReconnect) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after this, triggering reconnect
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);
        this.handlers.forEach((handler) => handler(message));
      } catch {
        // Ignore malformed messages
      }
    };
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
  }

  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
