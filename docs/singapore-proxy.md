# Future: a small proxy server in Singapore

Status: **idea for later, not set up.** Today the app uses the Deno Deploy proxy
(`https://kha-data.thet-dev.deno.net`, see `deno-deploy-proxy.md`).

## Why

The database (Supabase) is in **Singapore**, but Deno Deploy only runs in the
US and Europe. Every request goes Myanmar → Amsterdam → Singapore and back, which
adds about **0.5 s per request**.

The app was changed (Oct 2026) so that saving a sale or product waits for **one**
request only, and lists update in the background. If saving still feels slow,
a proxy in Singapore would cut that extra time to almost nothing:
Myanmar → Singapore (proxy) → Supabase (same city).

## What it is

A small rented server (VPS) in Singapore that runs **Caddy**, the same
forwarding setup already written for Cloud Run:
`supabase/proxies/cloud-run/Caddyfile`. It forwards REST, Auth, Edge Functions
and Realtime (WebSocket) to the Supabase project. It holds **no keys and no
data**; it only passes requests through.

## Rough steps

1. Rent a small Linux VPS in Singapore (1 vCPU, 1 GB RAM is plenty).
   Examples: Vultr, DigitalOcean, Linode/Akamai, Hetzner (SG). About
   **US$4–6 per month**.
2. Install Docker, then run Caddy with the Caddyfile from
   `supabase/proxies/cloud-run/` (set the Supabase project host in it).
3. **Test address without buying a domain:** use `sslip.io`, e.g.
   `https://203-0-113-10.sslip.io` for a server at `203.0.113.10`. Caddy gets
   an HTTPS certificate for it by itself.
4. In the app: Check connection > **Test another address** with that URL, on
   Myanmar networks (mobile data and Wi-Fi). All checks must pass.
5. Later, buy a domain and point a name (e.g. `api.example.com`) at the server,
   so the address does not depend on the server's IP.
6. Switch: change only `EXPO_PUBLIC_SUPABASE_URL` in the EAS environment
   variables (production and preview) and in `.env`, then rebuild.

## Keep in mind

- Keep the **Deno Deploy proxy as a backup**. If the VPS is blocked or down,
  switch the URL back and rebuild.
- A VPS needs simple care: system updates now and then. Caddy renews the HTTPS
  certificate by itself.
- A server's IP can be blocked in Myanmar (this happened with CloudFront).
  Always test with Check connection before switching.
- Never put the database password or the `service_role` key on the server. The
  proxy does not need them.
