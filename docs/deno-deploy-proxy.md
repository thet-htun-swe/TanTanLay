# Free Deno Deploy proxy in front of Supabase

Code: `supabase/proxies/deno-deploy/main.ts` (one file). It forwards sign-in,
data, Edge Functions and live updates (WebSockets) to Supabase, like the
Cloudflare Worker. Tested on a computer against the real project: the app's
three checks pass and a real Supabase client reads data and subscribes to live
updates through it.

Deno Deploy changed in 2026: the old dashboard (dash.deno.com, "Deploy Classic")
shut down on 20 July 2026. Use the new one at **console.deno.com**. Apps are
created from GitHub or from the command line (`deno deploy`); this guide uses
the command line because the code is already in this repository.

**Cost: free plan, $0.** Limits per month (Oct 2026): 1M requests, 20 GiB data
out, 10 h active CPU, 150 GiB-h memory time, 10 apps, 5 custom domains. A small
shop fits easily. Keep an eye on the usage page for the first weeks (open
live-update connections may count towards memory time).

No secret goes into the proxy: the app sends its public key with each request.
Never put the `service_role` / secret key or the database password here.

## 1. Create a Deno Deploy organization (once, in the browser)

1. Go to **https://console.deno.com** and sign in (GitHub or Google account).
2. Create an **organization**. Its slug becomes part of the address and **cannot
   be changed later**, so pick something neutral, e.g. `khashop` (avoid words like
   "proxy" or "vpn").

## 2. Deploy the proxy (one command, on your computer)

Open PowerShell (or a terminal) and run:

```bash
cd "D:\weekend projects\tantanlay\supabase\proxies\deno-deploy"
```

```bash
npx -y deno@latest deploy create --org khashop --app kha-data --source local --runtime-mode dynamic --entrypoint main.ts --region global
```

- Replace `khashop` with your organization slug. `kha-data` is the app name
  (also neutral on purpose).
- `npx -y deno@latest` runs Deno without installing it permanently. If Deno is
  already installed, use `deno deploy create ...` instead.
- The first time, it asks you to **sign in**: a browser window opens, approve
  it, then return to the terminal. (The token is stored in your system keyring.)
- If it asks extra questions (build timeout, memory), accept the defaults.
- Prefer a step-by-step wizard? Run `npx -y deno@latest deploy create` without
  the extra options and answer: your org > `kha-data` > **local** > this folder >
  **dynamic** > entrypoint `main.ts` > region **global**.

When the build finishes it shows the address, normally:

```
https://kha-data.khashop.deno.net
```

You can also find it in console.deno.com > your org > `kha-data`.

Optional: environment variable `SUPABASE_HOST` (default
`zulteqlxedmtabdnivxi.supabase.co`), only if the Supabase project ever changes:
`npx -y deno@latest deploy env add SUPABASE_HOST <host> --org khashop --app kha-data`

## 3. Test from a computer

```bash
curl https://kha-data.khashop.deno.net/ping
```

```bash
curl -i https://kha-data.khashop.deno.net/auth/v1/health -H "apikey: sb_publishable_..."
```

Expected: `proxy ok, supabase status: 401`, then `HTTP 200` with a small JSON reply.

## 4. Test on the shop's networks

The phones need a build that has **Check connection > Test another address**
(branch `feature/check-connection` or later).

On each network the shop uses (each SIM operator, shop Wi-Fi), **VPN off**:
login screen > **Trouble signing in? Check connection** > **Test another address**
> type `kha-data.khashop.deno.net` > **Test this address**. All three must pass:
**Reaches Supabase**, **Sign-in request**, **Live updates**. Then **Share results**.

## 5. Switch the app (only if it passes everywhere)

```bash
eas env:update --name EXPO_PUBLIC_SUPABASE_URL --value https://kha-data.khashop.deno.net --environment production --environment preview
```

Update `EXPO_PUBLIC_SUPABASE_URL` in the local `.env` too, make a new build and
share the APK. The login screen should show the new **Server:** address.

## Updating or removing

- Change the proxy code: in `supabase/proxies/deno-deploy` run
  `npx -y deno@latest deploy --prod` (the folder's `deno.jsonc` says which org/app;
  for this shop `thet-dev` / `kha-data`). No app build needed.
- Remove: console.deno.com > `kha-data` > Settings > delete the app.
