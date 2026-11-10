import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom React hook managing lifecycle, messaging, and concurrency for
 * the dedicated telemetry background Web Worker.
 *
 * Offloads intensive mathematical, optical, and signal analysis away
 * from the browser main thread to maintain smooth 60fps rendering and low INP.
 *
 * @returns {{
 *   isWorkerReady: boolean,
 *   isProcessing: boolean,
 *   lastResult: any,
 *   workerError: string|null,
 *   calculateMovingAverage: (values: number[], windowSize?: number) => Promise<any>,
 *   generateEcgWaveform: (options?: { heartRate?: number, sampleRate?: number, durationSeconds?: number }) => Promise<any>,
 *   analyzeImageMetrics: (pixelArray: number[]|Uint8ClampedArray) => Promise<any>,
 *   runTask: (type: string, payload: any) => Promise<any>
 * }}
 */
export function useTelemetryWorker() {
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [workerError, setWorkerError] = useState(null);

  const workerRef = useRef(null);
  const pendingRequestsRef = useRef(new Map());

  // Initialize and tear down the background Web Worker
  useEffect(() => {
    let workerInstance;

    try {
      workerInstance = new Worker(
        new URL('../workers/telemetryWorker.js', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (event) => {
        const { id, success, result, error } = event.data || {};
        const pending = pendingRequestsRef.current.get(id);

        if (pending) {
          pendingRequestsRef.current.delete(id);
          setIsProcessing(pendingRequestsRef.current.size > 0);

          if (success) {
            setLastResult(result);
            pending.resolve(result);
          } else {
            const err = new Error(error || 'Worker task failed');
            setWorkerError(err.message);
            pending.reject(err);
          }
        }
      };

      workerInstance.onerror = (err) => {
        console.error('[useTelemetryWorker] Worker runtime error:', err);
        setWorkerError(err.message || 'Worker thread execution error');
        setIsProcessing(false);

        // Reject all in-flight pending tasks
        pendingRequestsRef.current.forEach(({ reject }) => {
          reject(new Error('Worker crashed during execution'));
        });
        pendingRequestsRef.current.clear();
      };

      workerRef.current = workerInstance;
      setIsWorkerReady(true);
    } catch (err) {
      console.error('[useTelemetryWorker] Failed to initialize worker:', err);
      setWorkerError(err.message);
      setIsWorkerReady(false);
    }

    return () => {
      if (workerInstance) {
        workerInstance.terminate();
        workerRef.current = null;
      }
      pendingRequestsRef.current.clear();
      setIsWorkerReady(false);
    };
  }, []);

  /**
   * Dispatches an asynchronous computation request to the worker thread.
   */
  const runTask = useCallback((type, payload) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Telemetry Web Worker is not initialized or ready.'));
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      pendingRequestsRef.current.set(id, { resolve, reject });
      setIsProcessing(true);
      setWorkerError(null);

      workerRef.current.postMessage({ id, type, payload });
    });
  }, []);

  /**
   * Computes simple moving average and standard deviation off-thread.
   */
  const calculateMovingAverage = useCallback(
    (values, windowSize = 5) => {
      return runTask('CALCULATE_MOVING_AVERAGE', { values, windowSize });
    },
    [runTask]
  );

  /**
   * Generates physiological ECG lead II waveform coordinates off-thread.
   */
  const generateEcgWaveform = useCallback(
    (options = {}) => {
      return runTask('GENERATE_ECG_WAVEFORM', options);
    },
    [runTask]
  );

  /**
   * Computes optical image histogram and RMS contrast off-thread.
   */
  const analyzeImageMetrics = useCallback(
    (pixelArray) => {
      return runTask('ANALYZE_IMAGE_METRICS', { pixelArray });
    },
    [runTask]
  );

  return {
    isWorkerReady,
    isProcessing,
    lastResult,
    workerError,
    calculateMovingAverage,
    generateEcgWaveform,
    analyzeImageMetrics,
    runTask,
  };
}

export default useTelemetryWorker;
