# Google Cloud Run proxy in front of Supabase

Code: `supabase/proxies/cloud-run/` (`Dockerfile` + `Caddyfile`). It runs the
official Caddy web server, which forwards sign-in, data, Edge Functions and live
updates (WebSockets) to Supabase. Tested on a computer against the real project:
the app's three checks pass and a real Supabase client reads data and subscribes
to live updates through it.

Why Cloud Run: `googleapis.com` answered quickly on every network tested so far
(and Google Drive works for the users), so Google's network looks reachable.
The Cloud Run address (`*.run.app`) still needs its own test on the shop's networks.

No secret goes into the proxy: the app sends its public key with each request.
Never put the `service_role` / secret key or the database password here.

## Cost - read this first

- Testing is free (a few short requests).
- **As the app's main server, live updates are NOT free on Cloud Run.** Every
  phone that has the app open keeps a live-update connection open, and Cloud Run
  charges for the time at least one connection is open. Rough estimate with the
  settings below (1 CPU, 256 MB, one shared instance): the free tier covers about
  **50 hours of "app open somewhere" per month**; a shop open ~10 hours a day
  would cost roughly **US$20-30 per month**. Check the current Cloud Run pricing.
- Requests themselves (sign-in, sales) fit easily in the free tier.
- Deno Deploy (`docs/deno-deploy-proxy.md`) does not charge for idle connections
  in the same way, so prefer it if both pass the network test.

## 1. Google Cloud account (once)

1. Go to https://console.cloud.google.com and sign in with a Google account.
2. Create a project, e.g. `kha-proxy`.
3. Billing: link a billing account (needs a card; the free tier still applies).
4. Billing > **Budgets & alerts** > Create budget, e.g. US$5, with email alerts.

## 2. Deploy from Cloud Shell (nothing to install)

1. In the console, click the **Activate Cloud Shell** icon (`>_`, top right).
   Make sure the project `kha-proxy` is selected.
2. Create the two files. Click **Open Editor**, create a folder `kha-proxy`, and
   in it create `Dockerfile` and `Caddyfile` with exactly the contents of
   `supabase/proxies/cloud-run/Dockerfile` and `supabase/proxies/cloud-run/Caddyfile`
   from this repository.
3. Back in the terminal:

   ```bash
   cd ~/kha-proxy
   gcloud run deploy kha-data \
     --source . \
     --region asia-southeast1 \
     --allow-unauthenticated \
     --port 8080 \
     --timeout 3600 \
     --cpu 1 --memory 256Mi \
     --min-instances 0 --max-instances 1 \
     --concurrency 1000
   ```

   - Say **Yes** when it asks to enable APIs (Cloud Run, Cloud Build, Artifact Registry)
     and to create an Artifact Registry repository.
   - `asia-southeast1` = Singapore, close to Myanmar and to the Supabase project.
   - `--timeout 3600` keeps live-update connections open for up to 1 hour (the app
     reconnects by itself after that).
   - `--max-instances 1` caps the cost: one instance serves all phones.
4. When it finishes it prints the **Service URL**, e.g.
   `https://kha-data-abc123xyz-as.a.run.app`. Copy it.

## 3. Test from a computer

```bash
curl -i https://kha-data-abc123xyz-as.a.run.app/auth/v1/health -H "apikey: sb_publishable_..."
```

Expected: `HTTP/2 200` and a small JSON reply. (`/ping` on this proxy returns
Supabase's "No API key" message with HTTP 401 - that also means it works.)

## 4. Test on the shop's networks

On each network the shop uses (each SIM operator, shop Wi-Fi), **VPN off**:
login screen > **Check connection** > **Test another address** > type the Service
URL > **Test this address**. All three must pass: **Reaches Supabase**,
**Sign-in request**, **Live updates**. Then **Share results**.

## 5. Switch the app (only if it passes everywhere, and the cost is OK)

```bash
eas env:update --name EXPO_PUBLIC_SUPABASE_URL --value https://kha-data-abc123xyz-as.a.run.app --environment production --environment preview
```

Update the local `.env` too, make a new build and share the APK.

## Updating or removing

- Change the config: edit the files in Cloud Shell and run the same
  `gcloud run deploy` command again (no app build needed).
- Remove: Cloud Run > select `kha-data` > **Delete** (and delete the image in
  Artifact Registry to avoid storage charges).
