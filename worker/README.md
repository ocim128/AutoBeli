# AutoBeli Outbound Email Worker

This worker is a dedicated outbound-only email endpoint for AutoBeli.

It is intentionally separate from the `akunlama` disposable-email worker. AutoBeli only needs:

- authenticated `POST /api/outbound/purchase`
- optional `GET /api/health`
- Cloudflare `send_email` binding

## Config

Wrangler config: [wrangler.autobeli.toml](./wrangler.autobeli.toml)

Current defaults:

- worker name: `autobeli-outbound-email`
- default sender: `noreply@akunlama.com`
- allowed sender domains: `akunlama.com`

Required secret:

```powershell
npx wrangler secret put OUTBOUND_EMAIL_API_KEY --config wrangler.autobeli.toml
```

## Important Cloudflare Limit

As of April 16, 2026, Cloudflare documents that Email Service starts in verified-recipient mode, and only paid-plan accounts can send to arbitrary recipients.

That means:

- verified destination addresses can be used for testing
- arbitrary customer emails will fail until Email Service is enabled on a paid plan for the account

If sends fail with `E_RECIPIENT_NOT_ALLOWED`, this is a Cloudflare account capability issue, not a worker code issue.

## Deploy

```powershell
cd worker
npx wrangler whoami
npx wrangler deploy --config wrangler.autobeli.toml
```

After deploy, point the app to:

```text
https://<your-workers-subdomain>.workers.dev/api/outbound/purchase
```

Set the same API key in Vercel as `CLOUDFLARE_EMAIL_API_KEY`.

Recommended Vercel env values:

```text
CLOUDFLARE_EMAIL_API_URL=https://<your-workers-subdomain>.workers.dev/api/outbound/purchase
CLOUDFLARE_EMAIL_API_KEY=<same-as-worker-secret>
CLOUDFLARE_EMAIL_FROM=noreply@akunlama.com
CLOUDFLARE_EMAIL_FROM_NAME=AutoBeli
```
