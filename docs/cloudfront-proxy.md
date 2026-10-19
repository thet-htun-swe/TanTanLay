# Free AWS CloudFront proxy in front of Supabase

Why: in the shop's country `*.supabase.co` and `*.workers.dev` are blocked, but
`*.cloudfront.net` was reachable in the app's Check connection test. CloudFront
can forward everything (sign-in, data, live updates) to Supabase from a free
`dxxxxxxxx.cloudfront.net` address, so no domain has to be bought.

Cost: $0 for this shop's traffic (AWS always-free tier: 1 TB data and 10 million
requests per month; or the CloudFront "Free" flat-rate plan if the console offers
plans). An AWS account still needs a payment card.

Values used below:

| Value | |
| --- | --- |
| Supabase project address (origin) | `zulteqlxedmtabdnivxi.supabase.co` |
| Publishable key | from `.env` (`EXPO_PUBLIC_SUPABASE_KEY`) |

Never use the `service_role` / secret key or the database password anywhere here.

---

## 1. AWS account and a spending alarm (once)

1. Create an account at https://aws.amazon.com (needs a card).
2. Turn on MFA for the root user (Account menu > Security credentials).
3. Billing and Cost Management > **Budgets** > Create budget > template
   **Zero spend budget** > your email. You get an email if anything ever costs money.

## 2. Create the distribution

CloudFront console (https://console.aws.amazon.com/cloudfront) > **Create distribution**.
The console layout changes over time; the settings that matter are listed here.
If the console first asks you to **choose a plan**, pick **Free** (or pay-as-you-go,
which is also free at this traffic).

**Origin**

| Setting | Value |
| --- | --- |
| Origin type | Other / custom origin |
| Origin domain | `zulteqlxedmtabdnivxi.supabase.co` |
| Protocol | **HTTPS only**, port 443 |
| Origin path | (leave empty) |

**Default cache behavior**

| Setting | Value | Why |
| --- | --- | --- |
| Viewer protocol policy | **Redirect HTTP to HTTPS** | |
| Allowed HTTP methods | **GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE** | sign-in and saving sales use POST/PATCH |
| Cache policy | **CachingDisabled** (managed) | every request must reach Supabase, nothing cached |
| Origin request policy | **AllViewerExceptHostHeader** (managed) | passes the login token, `apikey`, query strings and WebSocket headers; Supabase gets its own host name |
| Response headers policy | (none) | |

Live updates (WebSockets) work automatically with these settings.

**Other settings**

| Setting | Value |
| --- | --- |
| Web Application Firewall (WAF) | **Do not enable** on pay-as-you-go (it costs money). On the Free plan it is included; leave the default. |
| Price class | Any (e.g. "Use all edge locations") |
| IPv6 | On |
| Alternate domain name / certificate | (leave empty; only needed for your own domain later) |

Click **Create distribution**. Wait until **Status = Enabled** and
**Last modified = Deployed** (about 5-10 minutes).

Copy the **Distribution domain name**, e.g. `d1abcd2efgh3ij.cloudfront.net`.

## 3. Test from a computer

```bash
curl -i https://d1abcd2efgh3ij.cloudfront.net/auth/v1/health -H "apikey: sb_publishable_..."
```

Expected: `HTTP/2 200` and a small JSON reply from Supabase Auth.
A `403` or an HTML page means a setting above is wrong (most often the origin
request policy or allowed methods).

## 4. Test in the app, on the shop's real networks

On each phone/network the shop uses (each SIM operator, shop Wi-Fi), **VPN off**:

1. Login screen > **Trouble signing in? Check connection** (or Settings > App > Check connection).
2. **Test another address** > type `d1abcd2efgh3ij.cloudfront.net` > **Test this address**.
3. All three must pass: **Reaches Supabase**, **Sign-in request**, **Live updates**.
4. **Share results** and keep them.

Only switch the app when it passes on every network.

## 5. Switch the app to the new address

1. EAS environment variables (production and preview):
   ```bash
   eas env:update --name EXPO_PUBLIC_SUPABASE_URL --value https://d1abcd2efgh3ij.cloudfront.net --environment production --environment preview
   ```
   (or Expo dashboard > Project > Environment variables)
2. Local `.env`: `EXPO_PUBLIC_SUPABASE_URL=https://d1abcd2efgh3ij.cloudfront.net`
3. New build: `eas build --platform android --profile production`, share the APK (e.g. Google Drive).
4. On the phone, the login screen should show **Server: d1abcd2efgh3ij.cloudfront.net**.

Keep the Cloudflare Worker: it costs nothing and can become a backup (e.g. with a
custom domain later).

## Notes

- All app users reach Supabase through CloudFront, so Supabase sees CloudFront's
  addresses. Fine for a small shop.
- If the `cloudfront.net` address is ever blocked, add your own domain to the same
  distribution (Alternate domain name + a free AWS certificate) and switch to it;
  no app code changes, only the URL.
- To stop it: CloudFront > select the distribution > **Disable**, then **Delete**.
