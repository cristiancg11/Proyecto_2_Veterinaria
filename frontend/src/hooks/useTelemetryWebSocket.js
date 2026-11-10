import { useState, useEffect, useRef, useCallback } from 'react';
import {
  telemetryWebSocketClient,
  ConnectionState,
} from '../services/telemetryWebSocketService';

/**
 * Custom React hook feeding real-time ICU telemetry metrics and physiological
 * streaming updates into the client application state.
 *
 * @param {Object} [options]
 * @param {boolean} [options.autoConnect=true] - Whether to connect automatically on mount.
 * @param {number} [options.maxHistoryLength=60] - Maximum retained data points for real-time sparklines.
 * @returns {{
 *   connectionState: string,
 *   isConnected: boolean,
 *   telemetry: {
 *     heartRate?: number,
 *     spO2?: number,
 *     temperature?: number,
 *     respiratoryRate?: number,
 *     bloodPressure?: { systolic: number, diastolic: number },
 *     timestamp?: number,
 *     [key: string]: any
 *   },
 *   history: Array<any>,
 *   reconnectAttempts: number,
 *   sendPayload: (data: any) => boolean,
 *   reconnect: () => void,
 *   disconnect: () => void
 * }}
 */
export function useTelemetryWebSocket({ autoConnect = true, maxHistoryLength = 60 } = {}) {
  const [connectionState, setConnectionState] = useState(telemetryWebSocketClient.state);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [telemetry, setTelemetry] = useState({
    heartRate: 84,
    spO2: 98,
    temperature: 38.5,
    respiratoryRate: 22,
    timestamp: Date.now(),
  });
  const [history, setHistory] = useState([]);

  const isConnected = connectionState === ConnectionState.OPEN;
  const historyRef = useRef([]);

  useEffect(() => {
    // 1. Status and reconnection listener
    const unsubscribeStatus = telemetryWebSocketClient.subscribe('status', (info) => {
      setConnectionState(info.state);
      setReconnectAttempts(info.attempts || 0);
    });

    // 2. Incoming clinical telemetry frame listener
    const unsubscribeTelemetry = telemetryWebSocketClient.subscribe('telemetry', (payload) => {
      const data = payload?.data || payload;
      const normalizedPoint = {
        heartRate: data?.heart_rate ?? data?.heartRate ?? 80,
        spO2: data?.spo2 ?? data?.spO2 ?? 98,
        temperature: data?.temperature ?? data?.temp ?? 38.5,
        respiratoryRate: data?.respiratory_rate ?? data?.respiratoryRate ?? 20,
        bloodPressure: data?.blood_pressure ?? data?.bloodPressure,
        timestamp: data?.timestamp || Date.now(),
        ...data,
      };

      setTelemetry(normalizedPoint);

      // Append to bounded sliding window history
      historyRef.current = [...historyRef.current, normalizedPoint].slice(-maxHistoryLength);
      setHistory([...historyRef.current]);
    });

    // Auto connect on mount if requested
    if (autoConnect) {
      telemetryWebSocketClient.connect();
    }

    return () => {
      unsubscribeStatus();
      unsubscribeTelemetry();
    };
  }, [autoConnect, maxHistoryLength]);

  const sendPayload = useCallback((data) => {
    return telemetryWebSocketClient.send(data);
  }, []);

  const reconnect = useCallback(() => {
    telemetryWebSocketClient.connect();
  }, []);

  const disconnect = useCallback(() => {
    telemetryWebSocketClient.disconnect();
  }, []);

  return {
    connectionState,
    isConnected,
    telemetry,
    history,
    reconnectAttempts,
    sendPayload,
    reconnect,
    disconnect,
  };
}

export default useTelemetryWebSocket;
