/**
 * Resilient Client-Side WebSocket Client for Clinical Telemetry and ICU Streaming.
 * 
 * Features:
 * - Jittered Exponential Backoff auto-reconnection
 * - Bidirectional Heartbeat (Ping/Pong) dead-connection detection
 * - Event-driven pub/sub listener registration
 * - Offline message buffering and delivery upon reconnection
 */

export const ConnectionState = {
  CONNECTING: 'CONNECTING',
  OPEN: 'OPEN',
  CLOSING: 'CLOSING',
  CLOSED: 'CLOSED',
  RECONNECTING: 'RECONNECTING',
};

const DEFAULT_WS_URL =
  (typeof window !== 'undefined' &&
    window.location &&
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws/telemetry`) ||
  'ws://localhost:8000/ws/telemetry';

export class TelemetryWebSocketClient {
  /**
   * @param {Object} options
   * @param {string} [options.url] - WebSocket server endpoint.
   * @param {number} [options.baseDelay=1000] - Base reconnection delay in ms.
   * @param {number} [options.maxDelay=30000] - Maximum reconnection delay in ms.
   * @param {number} [options.backoffFactor=1.8] - Exponential multiplier.
   * @param {number} [options.heartbeatInterval=25000] - Ping cycle in ms.
   * @param {number} [options.heartbeatTimeout=8000] - Expected pong threshold in ms.
   */
  constructor({
    url = DEFAULT_WS_URL,
    baseDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 1.8,
    heartbeatInterval = 25000,
    heartbeatTimeout = 8000,
  } = {}) {
    this.url = url;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.backoffFactor = backoffFactor;
    this.heartbeatInterval = heartbeatInterval;
    this.heartbeatTimeout = heartbeatTimeout;

    this.socket = null;
    this.state = ConnectionState.CLOSED;
    this.reconnectAttempts = 0;
    this.isExplicitDisconnect = false;

    this.listeners = new Map();
    this.messageBuffer = [];

    this.pingTimer = null;
    this.pongTimeoutTimer = null;
    this.reconnectTimer = null;
  }

  /**
   * Subscribes an observer callback to a specific telemetry event.
   *
   * @param {string} event - Event name ('open', 'close', 'error', 'status', 'telemetry', 'ping', 'pong', '*').
   * @param {(data: any) => void} callback - Event handler function.
   * @returns {() => void} Unsubscribe function.
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    return () => {
      const set = this.listeners.get(event);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(event);
        }
      }
    };
  }

  /**
   * Dispatches internal event to registered subscribers.
   */
  emit(event, data) {
    const specificHandlers = this.listeners.get(event);
    if (specificHandlers) {
      specificHandlers.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error(`[TelemetryWebSocketClient] Error in listener for "${event}":`, err);
        }
      });
    }

    const wildcardHandlers = this.listeners.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((cb) => {
        try {
          cb({ event, data });
        } catch (err) {
          console.error(`[TelemetryWebSocketClient] Error in wildcard listener:`, err);
        }
      });
    }
  }

  /**
   * Establishes the WebSocket connection with error boundary and backoff logic.
   */
  connect() {
    if (
      this.socket &&
      (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isExplicitDisconnect = false;
    this.clearTimers();
    this.setState(
      this.reconnectAttempts > 0 ? ConnectionState.RECONNECTING : ConnectionState.CONNECTING
    );

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = (event) => {
        this.reconnectAttempts = 0;
        this.setState(ConnectionState.OPEN);
        this.startHeartbeat();
        this.flushMessageBuffer();
        this.emit('open', { event, timestamp: Date.now() });
      };

      this.socket.onmessage = (event) => {
        this.handleIncomingMessage(event);
      };

      this.socket.onerror = (error) => {
        this.emit('error', { error, state: this.state });
      };

      this.socket.onclose = (event) => {
        this.clearHeartbeat();
        this.setState(ConnectionState.CLOSED);
        this.emit('close', { code: event.code, reason: event.reason, wasClean: event.wasClean });

        if (!this.isExplicitDisconnect) {
          this.scheduleReconnect();
        }
      };
    } catch (err) {
      this.emit('error', { error: err, message: 'Initialization failed' });
      this.scheduleReconnect();
    }
  }

  /**
   * Sets current state and notifies status subscribers.
   */
  setState(nextState) {
    if (this.state !== nextState) {
      this.state = nextState;
      this.emit('status', {
        state: this.state,
        attempts: this.reconnectAttempts,
        bufferedCount: this.messageBuffer.length,
      });
    }
  }

  /**
   * Processes incoming frames from the server.
   */
  handleIncomingMessage(event) {
    try {
      const parsed = JSON.parse(event.data);

      // Handle server pong response
      if (parsed.type === 'pong') {
        this.clearPongTimeout();
        this.emit('pong', parsed);
        return;
      }

      // Handle server ping
      if (parsed.type === 'ping') {
        this.send({ type: 'pong', timestamp: Date.now() });
        return;
      }

      // Route telemetry or custom events
      const eventType = parsed.type || 'telemetry';
      this.emit(eventType, parsed);
    } catch {
      // Raw string fallback
      this.emit('raw', event.data);
    }
  }

  /**
   * Transmits data or buffers it if socket is currently offline.
   *
   * @param {Object|string} data - Payload to send.
   * @returns {boolean} True if dispatched immediately, false if queued.
   */
  send(data) {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(serialized);
        return true;
      } catch (err) {
        console.warn('[TelemetryWebSocketClient] Send failed, buffering payload:', err);
        this.messageBuffer.push(serialized);
        return false;
      }
    } else {
      this.messageBuffer.push(serialized);
      return false;
    }
  }

  /**
   * Flushes offline queued messages once connection is restored.
   */
  flushMessageBuffer() {
    if (this.messageBuffer.length === 0) return;

    const queue = [...this.messageBuffer];
    this.messageBuffer = [];

    while (queue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
      const msg = queue.shift();
      try {
        this.socket.send(msg);
      } catch (err) {
        this.messageBuffer.unshift(msg);
        break;
      }
    }
  }

  /**
   * Starts periodic heartbeat transmission.
   */
  startHeartbeat() {
    this.clearHeartbeat();

    this.pingTimer = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });

        // Set deadline for pong reception
        this.pongTimeoutTimer = setTimeout(() => {
          console.warn('[TelemetryWebSocketClient] Pong timeout exceeded. Reconnecting...');
          this.terminateSocket();
          this.scheduleReconnect();
        }, this.heartbeatTimeout);
      }
    }, this.heartbeatInterval);
  }

  clearPongTimeout() {
    if (this.pongTimeoutTimer) {
      clearTimeout(this.pongTimeoutTimer);
      this.pongTimeoutTimer = null;
    }
  }

  clearHeartbeat() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
    this.clearPongTimeout();
  }

  clearTimers() {
    this.clearHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Calculates next reconnect delay with random jitter (0.85 - 1.15x)
   * to avoid synchronized thundering herd spikes.
   */
  calculateBackoffDelay() {
    const exponential = Math.min(
      this.maxDelay,
      this.baseDelay * Math.pow(this.backoffFactor, this.reconnectAttempts)
    );
    const jitter = 0.85 + Math.random() * 0.3; // 85% - 115%
    return Math.round(exponential * jitter);
  }

  /**
   * Schedules reconnection after connection drop.
   */
  scheduleReconnect() {
    if (this.isExplicitDisconnect) return;

    this.reconnectAttempts++;
    const delay = this.calculateBackoffDelay();
    this.setState(ConnectionState.RECONNECTING);

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    this.clearTimers();
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  terminateSocket() {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
  }

  /**
   * Gracefully closes the active connection and aborts pending reconnect attempts.
   */
  disconnect() {
    this.isExplicitDisconnect = true;
    this.clearTimers();
    this.terminateSocket();
    this.setState(ConnectionState.CLOSED);
  }
}

// Global shared client instance for application-wide telemetry feed
export const telemetryWebSocketClient = new TelemetryWebSocketClient();

export default TelemetryWebSocketClient;
