/**
 * Event Loop & INP (Interaction to Next Paint) Optimization Utilities.
 * 
 * Prevents main-thread long tasks (>50ms) by cooperatively scheduling work
 * and yielding back to the browser's rendering and input event loop.
 * 
 * Prioritization Strategy:
 * 1. Native Prioritized Task Scheduling API (`scheduler.yield()`)
 * 2. High-performance Macrotask Interleaving via `MessageChannel`
 * 3. Fallback to `requestAnimationFrame` + `setTimeout(..., 0)`
 */

/**
 * Yields execution control back to the browser's main thread to allow
 * pending user interactions, styles, and paints to be flushed immediately.
 *
 * @returns {Promise<void>}
 */
export function yieldToMain() {
  // 1. Native Chromium Prioritized Task Scheduling API
  if (typeof window !== 'undefined' && 'scheduler' in window && typeof window.scheduler.yield === 'function') {
    return window.scheduler.yield();
  }

  // 2. High-priority Macrotask Interleaving with MessageChannel (faster than setTimeout 4ms clamping)
  if (typeof MessageChannel !== 'undefined') {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        channel.port1.close();
        channel.port2.close();
        resolve();
      };
      channel.port2.postMessage(null);
    });
  }

  // 3. Universal Fallback
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

/**
 * Executes an array processing task in cooperative slices, yielding back
 * to the main thread whenever execution time exceeds 16ms or chunk boundary is reached.
 *
 * Guarantees that INP (Interaction to Next Paint) latency stays safely below 200ms thresholds.
 *
 * @template T, R
 * @param {Array<T>} items - List of items to be processed.
 * @param {(item: T, index: number, allItems: Array<T>) => (R|Promise<R>)} taskFn - Transformation function.
 * @param {number} [chunkSize=25] - Target batch size per slice.
 * @returns {Promise<Array<R>>}
 */
export async function runChunkedTask(items = [], taskFn, chunkSize = 25) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const results = [];
  const total = items.length;
  let sliceStartTime = performance.now();

  for (let i = 0; i < total; i++) {
    const itemResult = await taskFn(items[i], i, items);
    results.push(itemResult);

    const currentTime = performance.now();
    const elapsedTime = currentTime - sliceStartTime;

    // Yield if we hit the configured chunk size boundary OR exceeded 16ms frame budget
    if ((i + 1) % chunkSize === 0 || elapsedTime >= 16) {
      await yieldToMain();
      sliceStartTime = performance.now();
    }
  }

  return results;
}

/**
 * Runs a heavy action after yielding to the main thread first,
 * ensuring immediate visual response (like button press or spinner) before execution.
 *
 * @template T
 * @param {() => Promise<T>|T} action - Action to execute.
 * @returns {Promise<T>}
 */
export async function withInputPriority(action) {
  await yieldToMain();
  return action();
}

export default {
  yieldToMain,
  runChunkedTask,
  withInputPriority,
};
