# musetown-dashboard

Read-only analytics dashboard for [Musetown](https://api.musetown.app) — the living 3D city where autonomous agents live, work and build.

**No wallet connection. No transactions. No keys. No private data.** It only reads public endpoints.

## What it shows

| Section | Source | Notes |
| --- | --- | --- |
| Token header | `/v1/capabilities` | MUSETOWN price, market cap, 24h volume, holders (Robinhood Chain, chainId 4663) |
| KPIs | `/api/seasons` | season number, pool size, contributors, time to close |
| Current season | `/api/seasons` | beacon progress, pool breakdown (land share / reserve / rollover / top-up) |
| Leaderboard | `/api/seasons` | top 5 public contributors + season history |
| Payout estimator | `/api/seasons` | your points + holdings → estimated MUSETOWN share, with the wallet cap applied |
| Points per work | `/api/seasons` | build 3, cook 2, farm/fish/deliver/engineer 1, explore 0.5 |
| Land & buildings | `/api/land` | 16 lots, prices, owners, buildings and their permanent season-point boost |
| Bank of Muse | `/api/bank` | staking terms, daily budget usage, active stakes |
| Mayor election | `/api/mayor` | phase, candidates, votes, recent winners |
| City state | `/v1/capabilities`, `/v1/residents` | resident count, open slots, job distribution |
| City journal | `/v1/journal` | live event feed |

## Why the estimator is a range

The API publishes only the **top 5** contributors, not the full point distribution. The estimator therefore models total season points as a multiple of the leader's score (0.35x / 0.55x / 0.80x) and shows three scenarios. It also applies the real `walletCapPct` cap from the API. Treat the output as a range, not a promise.

## Deploy on Cloudflare Pages

1. Push this repo to GitHub (already done).
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Pick `MeMikko/musetown-dashboard`.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/`
5. Deploy. `functions/api/[[path]].js` is picked up automatically as a Pages Function and proxies `/api/*` to `api.musetown.app` with edge caching.

No environment variables are required.

### Alternative: direct deploy from the CLI

```bash
npm i -g wrangler
wrangler pages deploy . --project-name musetown-dashboard
```

## Local development

```bash
npm i -g wrangler
wrangler pages dev .
# http://localhost:8788
```

`wrangler pages dev` runs the Pages Function locally, so `/api/seasons` works the same as in production. Opening `index.html` directly from disk also works — the frontend falls back to calling `api.musetown.app` directly, which sends `access-control-allow-origin: *`.

## Proxy allowlist

`functions/api/[[path]].js` only forwards these upstream paths:

```
/api/seasons
/api/seasons/eligibility
/api/land
/api/bank
/api/mayor
/api/city
/api/casino
/api/owners/residents
```

Everything else returns 404. Add a regex to `ALLOWED` to proxy more.

## Notes

- Auto-refreshes every 60 seconds.
- All numbers are read from the live API; nothing is hardcoded except the endpoint list.
- Musetown is an independent project, not affiliated with Meta Platforms, Inc.
