# Free Deno Deploy proxy in front of Supabase

Code: `supabase/proxies/deno-deploy/main.ts` (one file). It forwards sign-in,
data, Edge Functions and live updates (WebSockets) to Supabase, like the
Cloudflare Worker. Tested on a computer against the real project: the app's
three checks pass and a real Supabase client reads data and subscribes to live
updates through it.

Cost: free plan (no card needed at the time of writing). Check the current
limits on Deno's pricing page; this shop's traffic is small.

No secret goes into the proxy: the app sends its public key with each request.
Never put the `service_role` / secret key or the database password here.

## 1. Create the proxy

1. Go to https://deno.com/deploy and sign in (GitHub account).
2. Create a new **app / project** and choose the **Playground** (online editor)
   option. If you are asked for a repository instead, create a small GitHub repo
   containing only `main.ts` and connect it.
3. Delete the example code and paste the whole of
   `supabase/proxies/deno-deploy/main.ts`.
4. Name it something neutral (e.g. `kha-data`), then **Save & Deploy**.
5. Copy the address it shows, e.g. `https://kha-data.deno.dev` or
   `https://kha-data.<your-org>.deno.net` (the domain depends on the Deno Deploy
   version).

Optional: environment variable `SUPABASE_HOST` (default
`zulteqlxedmtabdnivxi.supabase.co`), only if the Supabase project changes.

## 2. Test from a computer

```bash
curl https://kha-data.deno.dev/ping
curl -i https://kha-data.deno.dev/auth/v1/health -H "apikey: sb_publishable_..."
```

Expected: `proxy ok, supabase status: 401`, then `HTTP 200` with a small JSON reply.

## 3. Test on the shop's networks

On each network the shop uses (each SIM operator, shop Wi-Fi), **VPN off**:
login screen > **Check connection** > **Test another address** > type the address
(without `https://` is fine) > **Test this address**. All three must pass:
**Reaches Supabase**, **Sign-in request**, **Live updates**. Then **Share results**.

## 4. Switch the app (only if it passes everywhere)

```bash
eas env:update --name EXPO_PUBLIC_SUPABASE_URL --value https://kha-data.deno.dev --environment production --environment preview
```

Update `EXPO_PUBLIC_SUPABASE_URL` in the local `.env` too, make a new build and
share the APK. The login screen should show the new **Server:** address.

## Updating or removing

- Change the code: paste the new `main.ts` in the playground and deploy again
  (no app build needed).
- Remove: delete the app/project in the Deno Deploy dashboard.
