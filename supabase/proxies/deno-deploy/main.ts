// =============================================================================
// TanTanLay / KHA Clothing - Supabase proxy for Deno Deploy
//
// Forwards every request (REST, Auth, Edge Functions) and Realtime WebSockets
// from https://<project>.deno.dev to Supabase, like the Cloudflare Worker.
// Setup: docs/deno-deploy-proxy.md
//
// Optional environment variable: SUPABASE_HOST (default below).
// No keys are stored here: the app sends its public key with each request.
// =============================================================================

const SUPABASE_HOST = Deno.env.get("SUPABASE_HOST") ?? "zulteqlxedmtabdnivxi.supabase.co";

// Realtime: open the same WebSocket to Supabase and pass messages both ways
function proxyWebSocket(req: Request, target: URL): Response {
  // Sub-protocols the phone asked for (Supabase Realtime normally sends none)
  const protocols = (req.headers.get("sec-websocket-protocol") ?? "")
    .split(",")
    .map((protocol) => protocol.trim())
    .filter(Boolean);
  const { socket: client, response } = Deno.upgradeWebSocket(req, { protocol: protocols[0] });
  target.protocol = "wss:";
  const upstream = new WebSocket(target.href, protocols);
  client.binaryType = "arraybuffer";
  upstream.binaryType = "arraybuffer";

  // Messages from the phone that arrive before Supabase is connected
  const pending: (string | ArrayBuffer)[] = [];

  client.onmessage = (event) => {
    if (upstream.readyState === WebSocket.OPEN) upstream.send(event.data);
    else pending.push(event.data);
  };
  upstream.onopen = () => {
    for (const message of pending.splice(0)) upstream.send(message);
  };
  upstream.onmessage = (event) => {
    if (client.readyState === WebSocket.OPEN) client.send(event.data);
  };

  const closeBoth = (code = 1000, reason = "") => {
    // 1005/1006 cannot be sent; use "normal" instead
    const safeCode = code === 1005 || code === 1006 ? 1000 : code;
    if (client.readyState === WebSocket.OPEN) client.close(safeCode, reason);
    if (upstream.readyState === WebSocket.OPEN || upstream.readyState === WebSocket.CONNECTING) {
      upstream.close(safeCode, reason);
    }
  };
  client.onclose = (event) => closeBoth(event.code, event.reason);
  upstream.onclose = (event) => closeBoth(event.code, event.reason);
  client.onerror = () => closeBoth(1011, "client error");
  upstream.onerror = () => closeBoth(1011, "upstream error");

  return response;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // Quick check that the proxy can reach Supabase (same as the Worker)
  if (url.pathname === "/ping") {
    const health = await fetch(`https://${SUPABASE_HOST}/auth/v1/health`);
    await health.body?.cancel();
    return new Response(`proxy ok, supabase status: ${health.status}`);
  }

  const target = new URL(url.pathname + url.search, `https://${SUPABASE_HOST}`);

  if (req.headers.get("upgrade")?.toLowerCase() === "websocket") {
    return proxyWebSocket(req, target);
  }

  const headers = new Headers(req.headers);
  headers.delete("host");
  const hasBody = req.method !== "GET" && req.method !== "HEAD";

  return await fetch(target, {
    method: req.method,
    headers,
    body: hasBody ? req.body : undefined,
    redirect: "manual",
  });
});
