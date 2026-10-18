// fetch with a time limit. Without one, a request on a network that accepts
// the connection but never answers waits forever (e.g. "Signing in..." that
// never ends). After the limit the request fails with a "timed out" error,
// which the app shows as a connection problem.

export const REQUEST_TIMEOUT_MS = 25000;

export const createFetchWithTimeout =
  (timeoutMs: number = REQUEST_TIMEOUT_MS, baseFetch: typeof fetch = fetch): typeof fetch =>
  async (input, init = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    // Keep honouring a cancel from the caller
    const callerSignal = init.signal;
    if (callerSignal) {
      if (callerSignal.aborted) controller.abort();
      else callerSignal.addEventListener("abort", () => controller.abort(), { once: true });
    }

    try {
      return await baseFetch(input, { ...init, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted && !callerSignal?.aborted) {
        // Same kind of error as React Native's "Network request failed"
        throw new TypeError(`Network request timed out after ${Math.round(timeoutMs / 1000)}s`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  };
