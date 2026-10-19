import { ConnectionTest } from "@/constants/connectionTests";
import { createFetchWithTimeout } from "@/lib/fetchWithTimeout";

// Runs one "Check connection" test with the app's own networking.
// ok      = the address answered (any HTTP status, or the WebSocket opened)
// timeout = no answer in time (typical of a silent block)
// failed  = refused / not found / TLS error

export type CheckStatus = "ok" | "timeout" | "failed";

export interface CheckResult {
  status: CheckStatus;
  detail: string; // e.g. "HTTP 400" or the error message
  ms: number;
}

export const CHECK_TIMEOUT_MS = 10000;

const fetchWithTimeout = createFetchWithTimeout(CHECK_TIMEOUT_MS);

const failure = (error: unknown, started: number): CheckResult => {
  const message = error instanceof Error ? error.message : String(error);
  return {
    status: /timed out/i.test(message) ? "timeout" : "failed",
    detail: /timed out/i.test(message) ? `No answer in ${CHECK_TIMEOUT_MS / 1000} s` : message,
    ms: Date.now() - started,
  };
};

// expected: HTTP statuses that prove the request reached Supabase (omit = any answer)
const httpCheck = async (
  url: string,
  init: RequestInit,
  expected?: number[],
): Promise<CheckResult> => {
  const started = Date.now();
  try {
    const response = await fetchWithTimeout(url, init);
    const ms = Date.now() - started;
    if (expected && !expected.includes(response.status)) {
      return {
        status: "failed",
        detail: `HTTP ${response.status}: the address answers, but not with Supabase's reply (check the proxy setup)`,
        ms,
      };
    }
    return { status: "ok", detail: `HTTP ${response.status}`, ms };
  } catch (error) {
    return failure(error, started);
  }
};

const websocketCheck = (baseUrl: string, apiKey: string) =>
  new Promise<CheckResult>((resolve) => {
    const started = Date.now();
    const url = `${baseUrl.replace(/^http/, "ws")}/realtime/v1/websocket?apikey=${encodeURIComponent(apiKey)}&vsn=1.0.0`;
    let finished = false;
    let socket: WebSocket | null = null;

    const finish = (result: Omit<CheckResult, "ms">) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      try {
        socket?.close();
      } catch {
        // already closed
      }
      resolve({ ...result, ms: Date.now() - started });
    };

    const timer = setTimeout(
      () => finish({ status: "timeout", detail: `No answer in ${CHECK_TIMEOUT_MS / 1000} s` }),
      CHECK_TIMEOUT_MS,
    );

    try {
      socket = new WebSocket(url);
      socket.onopen = () => finish({ status: "ok", detail: "Connected" });
      socket.onerror = (event) =>
        finish({ status: "failed", detail: (event as { message?: string }).message || "Connection error" });
      socket.onclose = (event) =>
        finish({ status: "failed", detail: `Closed (code ${event.code})` });
    } catch (error) {
      finish(failure(error, started));
    }
  });

export const runConnectionTest = (test: ConnectionTest, apiKey: string): Promise<CheckResult> => {
  switch (test.kind) {
    case "auth-post":
      // Same request as signing in, but with an empty body: the server answers
      // "missing email" (HTTP 400) without any account being involved
      return httpCheck(
        `${test.url}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: { apikey: apiKey, "Content-Type": "application/json" },
          body: "{}",
        },
        [400, 422],
      );
    case "supabase-health":
      return httpCheck(`${test.url}/auth/v1/health`, { method: "GET", headers: { apikey: apiKey } }, [200]);
    case "websocket":
      return websocketCheck(test.url, apiKey);
    default:
      return httpCheck(test.url, { method: "GET", headers: { "Cache-Control": "no-cache" } });
  }
};
