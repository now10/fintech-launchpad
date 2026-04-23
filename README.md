# Fintech Launchpad

A production-ready fintech web application built with React, TypeScript, Supabase, Stripe, and GoCardless.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Radix UI |
| State | TanStack React Query |
| Forms | React Hook Form + Zod |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe, GoCardless (Open Banking) |
| Testing | Vitest (unit), Playwright (e2e) |
| CI/CD | GitHub Actions |

---

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [GoCardless](https://gocardless.com) account
- A [Stripe](https://stripe.com) account

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/now10/fintech-launchpad.git
cd fintech-launchpad

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your values in .env (never commit this file)

# 4. Run the development server
npm run dev
```

The app will be available at `http://localhost:8080`.

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values. **Never commit `.env` to git.**

All secrets (GoCardless client secret, webhook secret, Supabase service role key) must only be set as environment variables in your deployment platform — never in source code.

For CI/CD, add all `VITE_*` variables as GitHub Actions Secrets under **Settings → Secrets and variables → Actions**.

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start local dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint (zero warnings) |
| `npm run typecheck` | TypeScript type check |
| `npm run test` | Run unit tests |
| `npm run test:coverage` | Unit tests with coverage report |
| `npm run test:e2e` | Run Playwright end-to-end tests |

---

## Project Structure

```
fintech-launchpad/
├── .github/workflows/     # CI/CD pipelines
├── e2e/                   # Playwright end-to-end tests
├── fintech-backend/       # Supabase Edge Functions (primary)
├── functions/             # Additional serverless functions
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   ├── hooks/             # Custom React hooks
│   ├── integrations/      # Supabase client config
│   ├── lib/               # Utility functions
│   ├── pages/             # Route-level page components
│   └── types/             # TypeScript type definitions
├── supabase/
│   └── migrations/        # Database schema migrations
├── .env.example           # Safe environment variable template
└── vite.config.ts         # Vite build config
```

---

## Database Migrations

Migrations live in `supabase/migrations/`. To apply locally:

```bash
npx supabase db push
```

To create a new migration:

```bash
npx supabase migration new your_migration_name
```

---

## Deployment

The CI/CD pipeline (`.github/workflows/ci.yml`) runs on every push to `main`:

1. Lint & typecheck
2. Unit tests with coverage
3. Production build
4. E2E tests against the build
5. Deploy (configure your target in the workflow file)

Add your deployment step to `.github/workflows/ci.yml` — examples for Vercel and Netlify are included as comments.

---

## Security

- All secrets are managed via environment variables — never hardcoded
- GoCardless `CLIENT_SECRET` and `WEBHOOK_SECRET` are server-side only (Supabase Edge Functions)
- Supabase Row Level Security (RLS) is enforced on all tables
- Content Security Policy headers are configured in `vite.config.ts`
- Dependencies are audited on every CI run

To report a security vulnerability, email [your-email@domain.com] directly — do not open a public issue.

---

## License

Private — all rights reserved.
