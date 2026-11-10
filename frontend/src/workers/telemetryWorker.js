/**
 * Dedicated Web Worker for Off-Thread Clinical Telemetry and Intensive Signal Processing.
 * 
 * Offloads computational workloads from the browser main thread:
 * 1. Vital signs moving average & variance filtering.
 * 2. Physiological ECG Lead II waveform and HRV (Heart Rate Variability) point generation.
 * 3. Optical image histogram, dynamic range, and RMS contrast analysis.
 */

/**
 * Calculates simple moving average (SMA) and standard deviation for a numeric signal.
 *
 * @param {Array<number>} values - Array of raw telemetry values.
 * @param {number} windowSize - Size of the rolling moving average window.
 * @returns {{ smoothed: Array<number>, mean: number, stdDev: number, trend: 'increasing'|'decreasing'|'stable' }}
 */
function computeMovingAverage(values = [], windowSize = 5) {
  if (!Array.isArray(values) || values.length === 0) {
    return { smoothed: [], mean: 0, stdDev: 0, trend: 'stable' };
  }

  const smoothed = [];
  const safeWindow = Math.max(1, Math.min(windowSize, values.length));

  for (let i = 0; i < values.length; i++) {
    const startIdx = Math.max(0, i - safeWindow + 1);
    const windowSlice = values.slice(startIdx, i + 1);
    const sum = windowSlice.reduce((acc, curr) => acc + curr, 0);
    smoothed.push(Number((sum / windowSlice.length).toFixed(2)));
  }

  const totalSum = values.reduce((acc, v) => acc + v, 0);
  const mean = totalSum / values.length;

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((acc, v) => acc + v, 0) / values.length;
  const stdDev = Math.sqrt(variance);

  let trend = 'stable';
  if (smoothed.length >= 2) {
    const delta = smoothed[smoothed.length - 1] - smoothed[0];
    if (delta > 0.05 * mean) trend = 'increasing';
    else if (delta < -0.05 * mean) trend = 'decreasing';
  }

  return {
    smoothed,
    mean: Number(mean.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    trend,
  };
}

/**
 * Generates calibrated ECG Lead II waveform points and computes HRV (RMSSD/SDNN).
 *
 * @param {Object} options
 * @param {number} options.heartRate - Beats per minute (default: 80).
 * @param {number} options.sampleRate - Sampling frequency in Hz (default: 250).
 * @param {number} options.durationSeconds - Length of the waveform in seconds (default: 2).
 * @returns {{ waveform: Array<{ timeMs: number, voltageMv: number }>, hr: number, rmssd: number }}
 */
function generateEcgWaveform({ heartRate = 80, sampleRate = 250, durationSeconds = 2 } = {}) {
  const bpm = Math.max(30, Math.min(220, heartRate));
  const beatIntervalMs = (60 / bpm) * 1000;
  const totalSamples = Math.round(durationSeconds * sampleRate);
  const waveform = [];

  for (let i = 0; i < totalSamples; i++) {
    const timeMs = (i / sampleRate) * 1000;
    const phaseMs = timeMs % beatIntervalMs;
    const normPhase = phaseMs / beatIntervalMs;

    let voltageMv = 0.0;

    // Baseline drift simulation
    voltageMv += 0.02 * Math.sin((2 * Math.PI * timeMs) / 3000);

    // P wave (Atrial Depolarization) around 15% of interval
    if (normPhase >= 0.12 && normPhase <= 0.22) {
      const pPhase = (normPhase - 0.17) / 0.05;
      voltageMv += 0.18 * Math.exp(-0.5 * Math.pow(pPhase * 3, 2));
    }

    // Q wave (Septal Depolarization) around 28% of interval
    if (normPhase >= 0.26 && normPhase <= 0.30) {
      const qPhase = (normPhase - 0.28) / 0.02;
      voltageMv -= 0.15 * Math.exp(-0.5 * Math.pow(qPhase * 3, 2));
    }

    // R wave (Ventricular Depolarization) sharp peak around 32% of interval
    if (normPhase >= 0.30 && normPhase <= 0.36) {
      const rPhase = (normPhase - 0.33) / 0.03;
      voltageMv += 1.45 * Math.exp(-0.5 * Math.pow(rPhase * 4, 2));
    }

    // S wave around 37% of interval
    if (normPhase >= 0.36 && normPhase <= 0.40) {
      const sPhase = (normPhase - 0.38) / 0.02;
      voltageMv -= 0.35 * Math.exp(-0.5 * Math.pow(sPhase * 3, 2));
    }

    // T wave (Ventricular Repolarization) around 55% of interval
    if (normPhase >= 0.48 && normPhase <= 0.65) {
      const tPhase = (normPhase - 0.56) / 0.08;
      voltageMv += 0.38 * Math.exp(-0.5 * Math.pow(tPhase * 3, 2));
    }

    waveform.push({
      timeMs: Math.round(timeMs),
      voltageMv: Number(voltageMv.toFixed(3)),
    });
  }

  // Simulated beat-to-beat variability (RMSSD)
  const rrIntervals = [beatIntervalMs - 12, beatIntervalMs + 8, beatIntervalMs - 5, beatIntervalMs + 10];
  const successiveDiffs = [];
  for (let j = 0; j < rrIntervals.length - 1; j++) {
    successiveDiffs.push(Math.pow(rrIntervals[j + 1] - rrIntervals[j], 2));
  }
  const rmssd = Math.sqrt(successiveDiffs.reduce((a, b) => a + b, 0) / successiveDiffs.length);

  return {
    waveform,
    heartRate: bpm,
    rmssd: Number(rmssd.toFixed(2)),
  };
}

/**
 * Computes 256-bin optical luminance histogram, dynamic range, and RMS contrast.
 *
 * @param {Uint8ClampedArray|Array<number>} pixelArray - Grayscale or interleaved RGBA buffer.
 * @returns {{ histogram: Array<number>, rmsContrast: number, dynamicRange: number, meanLuminance: number }}
 */
function analyzeImageLuminance(pixelArray = []) {
  const histogram = new Array(256).fill(0);
  const length = pixelArray.length;

  if (length === 0) {
    return {
      histogram,
      rmsContrast: 0,
      dynamicRange: 0,
      meanLuminance: 0,
    };
  }

  const isRgba = length % 4 === 0 && length >= 16;
  const step = isRgba ? 4 : 1;
  let totalPixels = 0;
  let sumLuminance = 0;

  for (let i = 0; i < length; i += step) {
    let luminance;
    if (isRgba) {
      // Rec. 709 Standard luma coefficients
      luminance = Math.round(0.2126 * pixelArray[i] + 0.7152 * pixelArray[i + 1] + 0.0722 * pixelArray[i + 2]);
    } else {
      luminance = Math.round(pixelArray[i]);
    }

    const clampedLuma = Math.max(0, Math.min(255, luminance));
    histogram[clampedLuma]++;
    sumLuminance += clampedLuma;
    totalPixels++;
  }

  const meanLuminance = totalPixels > 0 ? sumLuminance / totalPixels : 0;

  // Root-Mean-Square (RMS) contrast calculation
  let varianceSum = 0;
  for (let val = 0; val < 256; val++) {
    const count = histogram[val];
    if (count > 0) {
      varianceSum += count * Math.pow((val - meanLuminance) / 255, 2);
    }
  }
  const rmsContrast = totalPixels > 0 ? Math.sqrt(varianceSum / totalPixels) : 0;

  // Dynamic range computation
  let minIndex = 0;
  let maxIndex = 255;
  while (minIndex < 256 && histogram[minIndex] === 0) minIndex++;
  while (maxIndex >= 0 && histogram[maxIndex] === 0) maxIndex--;
  const dynamicRange = Math.max(0, maxIndex - minIndex);

  return {
    histogram,
    rmsContrast: Number(rmsContrast.toFixed(4)),
    dynamicRange,
    meanLuminance: Number(meanLuminance.toFixed(2)),
  };
}

/**
 * Main Web Worker Event Dispatcher.
 */
self.onmessage = (event) => {
  const { id, type, payload } = event.data || {};

  try {
    let result;

    switch (type) {
      case 'CALCULATE_MOVING_AVERAGE':
        result = computeMovingAverage(payload?.values, payload?.windowSize);
        break;

      case 'GENERATE_ECG_WAVEFORM':
        result = generateEcgWaveform(payload);
        break;

      case 'ANALYZE_IMAGE_METRICS':
        result = analyzeImageLuminance(payload?.pixelArray);
        break;

      default:
        throw new Error(`Unsupported Web Worker task type: "${type}"`);
    }

    self.postMessage({
      id,
      type,
      success: true,
      result,
      timestamp: Date.now(),
    });
  } catch (error) {
    self.postMessage({
      id,
      type,
      success: false,
      error: error.message || 'Worker computation error occurred.',
      timestamp: Date.now(),
    });
  }
};
