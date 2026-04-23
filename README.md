# AutoCollect — Fintech Launchpad

Recurring SEPA collection (GoCardless) + ACH (Stripe) with crypto/IBAN payouts. Built on React + Vite + Lovable Cloud (Supabase).

- **Preview**: https://id-preview--2b0e8ec7-4ed9-472e-b396-4d817e69e911.lovable.app
- **Live**: https://global-fintechlaunchpad.lovable.app

---

## Architecture

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, TypeScript, Tailwind, shadcn/ui, React Query |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase Postgres with RLS on every table |
| Auth | Supabase Auth (email + password) |
| Secrets | Supabase Vault (GoCardless tokens) + Edge Function secrets |
| Payment rails | GoCardless (SEPA + ACH), Stripe (US bank ACH) |
| Payout rails | GoCardless ACH, crypto wallets, manual IBAN |

### Edge functions

| Function | Purpose |
|---|---|
| `gocardless-oauth` | OAuth handshake; stores access token in Vault |
| `gocardless-webhook` | Idempotent webhook ingestion + signature verification |
| `stripe-webhook` | Idempotent Stripe event ingestion |
| `stripe-create-setup-intent` | Returns client secret for US bank linking |
| `create-customer` / `create-mandate` / `create-payment` / `create-bank-account` | Provisioning calls |
| `process-payout` | Debits wallet, creates GoCardless payout, writes ledger entry |

### Key DB tables

`businesses`, `customers`, `bank_accounts`, `mandates`, `payment_plans`, `payments`, `payouts`, `wallets`, `ledger_entries`, `crypto_wallets`, `webhook_events`, `profiles`, `user_roles`.

`businesses.mode` controls sandbox vs live. Webhook idempotency is enforced via the unique `(source, external_id)` constraint on `webhook_events`.

---

## Local development

```bash
npm install
npm run dev          # Vite dev server
npm test             # Vitest unit tests
npm run test:e2e     # Playwright (optional)
```

The Supabase client is auto-configured via `.env` (managed by Lovable Cloud — do not edit).

---

## Production secrets (Cloud → Secrets)

Already configured: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`.

**Required before going live:**

| Secret | Notes |
|---|---|
| `GOCARDLESS_LIVE_CLIENT_ID` | From your approved live OAuth app |
| `GOCARDLESS_LIVE_CLIENT_SECRET` | Same |
| `GOCARDLESS_LIVE_REDIRECT_URI` | `https://<your-domain>/oauth/callback` |
| `GOCARDLESS_SANDBOX_CLIENT_ID` | For sandbox mode |
| `GOCARDLESS_SANDBOX_CLIENT_SECRET` | For sandbox mode |
| `GOCARDLESS_SANDBOX_REDIRECT_URI` | Sandbox callback |
| `GOCARDLESS_WEBHOOK_SECRET` | From GoCardless dashboard webhook config |
| `STRIPE_SECRET_KEY` | Live `sk_live_…` |
| `STRIPE_WEBHOOK_SECRET` | Live `whsec_…` |

Edge functions read these via `Deno.env.get(...)`. The shared helper `supabase/functions/_shared/gocardless.ts` selects sandbox vs live values based on the business's `mode`.

---

## Go-live checklist

1. **Get GoCardless live OAuth app approved** (external — submit via the GoCardless partner portal).
2. **Add all live secrets** above in Lovable Cloud → Secrets.
3. **Configure provider webhooks**:
   - Stripe → `https://<project-ref>.functions.supabase.co/stripe-webhook` (events: `setup_intent.*`, `payment_intent.*`)
   - GoCardless → `https://<project-ref>.functions.supabase.co/gocardless-webhook` (mandates, payments, payouts)
4. **Enable HIBP** in Supabase Auth settings (leaked-password protection).
5. **Smoke test in sandbox**: signup → connect GoCardless → create customer → create mandate → trigger €1 payment → confirm webhook arrives in `webhook_events` → confirm ledger entry.
6. **Flip the toggle** in Settings → Environment → **Live**.
7. **Run a €1 live transaction** end-to-end.
8. **Verify the Webhook Health card** on the dashboard shows green (events processed in last 24h).

---

## Security model

- RLS on every table; owner scoping via `businesses.owner_id = auth.uid()`.
- `wallets`, `payments`, `payouts`, `mandates`, `ledger_entries`, `webhook_events`, `user_roles` are **read-only from the client** — all writes go through edge functions with the service role key.
- Roles in a separate `user_roles` table; `has_role()` SECURITY DEFINER function prevents recursion.
- GoCardless tokens stored in Supabase Vault, accessed via `get_gocardless_token()` RPC. The legacy `businesses.gocardless_access_token` column is null for new businesses and kept only for backfill.
- Webhooks verify provider signatures and dedupe via `webhook_events.(source, external_id)` unique index.

---

## What's intentionally not in this repo

- No standalone NestJS backend — all server logic runs as Supabase Edge Functions.
- No Docker — Lovable Cloud handles hosting.
- No CI/CD config — Lovable auto-deploys on every change; GitHub sync is optional via Connectors → GitHub.
