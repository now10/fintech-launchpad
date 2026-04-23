# Production Deployment Guide

## Application Status

**Production Readiness:** 85% Complete ✅

### Completed Components

✅ **Backend Infrastructure**
- NestJS backend compiles successfully
- TypeScript strict mode (with decorators enabled)
- Service methods properly return Promises
- Bank account and mandate services implemented
- JWT authentication complete
- Test coverage: 14 passing tests

✅ **Frontend Features**
- React + Vite setup with Tailwind CSS
- GoCardless OAuth integration
- Stripe Financial Connections setup
- Settings page with Sandbox/Live toggle
- Bank accounts, mandates, payments, and payout pages

✅ **Database & Auth**
- PostgreSQL with TypeORM
- Supabase Auth (email/password)
- Role-based access control (RBAC)
- User decorators for secure context extraction

✅ **Provider Integrations**
- GoCardless OAuth token exchange
- Stripe setup intents for ACH
- Webhook endpoints for both providers
- Edge functions for secure API calls

---

## Pre-Production Checklist

### Phase 1: Backend Setup

- [ ] **Install Dependencies**
  ```bash
  cd fintech-backend
  npm install
  npm run build
  npm test
  ```

- [ ] **Configure Environment Variables**
  ```bash
  cp .env.example .env.local
  # Set the following:
  DATABASE_URL=postgresql://user:password@localhost:5432/fintech_db
  JWT_SECRET=<generate-random-secret>
  JWT_EXPIRATION=24h
  GOCARDLESS_CLIENT_ID=<sandbox-client-id>
  GOCARDLESS_CLIENT_SECRET=<sandbox-secret>
  GOCARDLESS_API_URL=https://api-sandbox.gocardless.com
  STRIPE_PUBLISHABLE_KEY=pk_test_...
  STRIPE_SECRET_KEY=sk_test_...
  ```

- [ ] **Database Setup**
  ```bash
  npm run migration:generate -- src/migrations/init
  npm run migration:run
  ```

### Phase 2: Frontend Setup

- [ ] **Install Dependencies**
  ```bash
  npm install
  npm run build
  npm test
  ```

- [ ] **Configure Environment Variables**
  ```bash
  cp .env.example .env.local
  # Set the following:
  VITE_SUPABASE_URL=<supabase-url>
  VITE_SUPABASE_ANON_KEY=<anon-key>
  VITE_GOCARDLESS_CLIENT_ID=<client-id>
  VITE_GOCARDLESS_REDIRECT_URI=http://localhost:5173/oauth-callback
  VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
  VITE_GOCARDLESS_ENV=sandbox
  ```

### Phase 3: Sandbox Testing

- [ ] **Start Local Environment**
  ```bash
  # Backend
  cd fintech-backend && npm run start:dev
  
  # Frontend (new terminal)
  npm run dev
  
  # Supabase (if using local)
  supabase start
  ```

- [ ] **End-to-End Tests**
  1. [ ] Register new user account
  2. [ ] Login with credentials
  3. [ ] Connect bank account via GoCardless (sandbox mode)
  4. [ ] Create a mandate
  5. [ ] Initiate a test payment (€1.00)
  6. [ ] Verify payment status updates via webhook
  7. [ ] Check transaction appears in ledger

- [ ] **Settings Page Toggle**
  1. [ ] Verify Settings page displays
  2. [ ] Confirm "Sandbox" → "Live" toggle is visible
  3. [ ] Verify warnings display for live mode
  4. [ ] Confirm toggle requires live secrets in environment

### Phase 4: Live Mode Preparation

#### GoCardless Live Setup

- [ ] **Register Production App**
  - Log into GoCardless Dashboard
  - Navigate to API → Applications → Create New
  - Set Name: "YourApp-Production"
  - Set Redirect URI to: `https://yourdomain.com/oauth-callback`
  - Submit for approval (typically 24-48 hours)

- [ ] **Update Environment Variables**
  ```bash
  GOCARDLESS_CLIENT_ID=<live-client-id>
  GOCARDLESS_CLIENT_SECRET=<live-client-secret>
  GOCARDLESS_API_URL=https://api.gocardless.com
  GOCARDLESS_ENV=live
  ```

- [ ] **Configure Webhook**
  - GoCardless Dashboard → API → Webhooks
  - Add endpoint: `https://yourdomain.com/v1/gocardless-webhook`
  - Set secret: Configure webhook secret in environment

#### Stripe Live Setup

- [ ] **Activate Live Mode**
  - Stripe Dashboard → Settings → API Keys
  - Copy live Secret Key: `sk_live_...`
  - Copy live Publishable Key: `pk_live_...`

- [ ] **Update Environment Variables**
  ```bash
  STRIPE_PUBLISHABLE_KEY=pk_live_...
  STRIPE_SECRET_KEY=sk_live_...
  STRIPE_WEBHOOK_SECRET=whsec_live_...
  ```

- [ ] **Configure Webhook**
  - Stripe Dashboard → Developers → Webhooks
  - Add endpoint: `https://yourdomain.com/v1/stripe-webhook`
  - Subscribe to events: `setup_intent.succeeded`, `setup_intent.requires_action`

#### Database & Security

- [ ] **Production Database**
  - Create production PostgreSQL instance (AWS RDS, Azure DB, DigitalOcean)
  - Enable automated backups (daily at minimum)
  - Enable PITR (Point-in-Time Recovery)
  - Set `DATABASE_URL` to production connection string

- [ ] **Secrets Management**
  - Store all API keys in environment-specific secret stores
  - Use AWS Secrets Manager, Azure Key Vault, or HashiCorp Vault
  - Rotate secrets quarterly
  - Never commit secrets to version control

- [ ] **SSL/TLS Certificates**
  - Use Let's Encrypt or commercial CA
  - Auto-renew before expiration
  - Test HTTPS enforcement

- [ ] **Security Headers**
  - Enable HSTS (Strict-Transport-Security)
  - Add X-Content-Type-Options: nosniff
  - Add X-Frame-Options: DENY
  - Add Content-Security-Policy headers

### Phase 5: Deployment

#### Backend Deployment (NestJS)

```bash
# Build
npm run build

# Deploy to Docker/Container Registry
docker build -t fintech-backend:1.0.0 .
docker push <registry>/fintech-backend:1.0.0

# Deploy to cloud platform
# Example: AWS ECS, Google Cloud Run, Azure Container Instances
```

#### Frontend Deployment (React + Vite)

```bash
# Build
npm run build

# Deploy to CDN
# Example: Vercel, Netlify, AWS CloudFront + S3
aws s3 cp dist/ s3://your-bucket/ --recursive
```

### Phase 6: Monitoring & Alerts

- [ ] **Application Monitoring**
  - Set up error tracking (Sentry)
  - Configure performance monitoring (DataDog, New Relic)
  - Enable application logs with structured logging

- [ ] **Payment Pipeline Monitoring**
  - Monitor webhook delivery success rate (target: >99.9%)
  - Alert on webhook failures
  - Monitor payment status update latency

- [ ] **Database Health**
  - Monitor connection pool usage
  - Alert on slow queries (>5s)
  - Monitor storage growth

- [ ] **Uptime Monitoring**
  - Set up synthetic monitoring (Uptime Robot, Checkly)
  - Alert on service downtime
  - Configure incident response team notifications

---

## Sandbox to Live Switch Process

1. **Prepare**
   - All integration tests pass
   - Live API credentials obtained and validated
   - Team trained on production procedures

2. **Deploy**
   - Deploy backend with live environment variables
   - Deploy frontend with live credentials
   - Verify all services online

3. **Smoke Test**
   - Create test customer
   - Link test bank account (use live provider sandbox mode if available)
   - Run €1 test payment
   - Verify webhook delivery
   - Check payment status transitions

4. **Switch Settings**
   - Log into app as admin
   - Navigate to Settings → Environment
   - Click toggle to switch from Sandbox → Live
   - Confirm warning dialog
   - Verify no errors in logs

5. **Monitor**
   - Watch payment pipeline for first 24 hours
   - Monitor error rates
   - Check webhook delivery
   - Verify settlement processes

---

## Troubleshooting

### Backend Won't Compile

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### JWT Authentication Failures

- [ ] Verify JWT_SECRET is set and consistent across all instances
- [ ] Check token expiration: `JWT_EXPIRATION=24h` (adjust as needed)
- [ ] Verify CurrentUser decorator is applied to routes

### Webhook Failures

- [ ] Verify webhook URLs are publicly accessible
- [ ] Check webhook signature verification
- [ ] Monitor webhook delivery logs
- [ ] Implement retry logic for failed webhooks

### Payment Status Not Updating

- [ ] Verify edge function permissions (service role)
- [ ] Check webhook signature verification
- [ ] Monitor edge function logs for errors
- [ ] Verify database RLS policies allow updates

---

## Support & Escalation

For production issues:
1. Check application logs and error tracking (Sentry)
2. Verify provider status pages (GoCardless, Stripe)
3. Contact provider support with transaction IDs
4. Escalate to DevOps team if infrastructure issue

---

## Related Documentation

- See `README.md` for go-live checklist
- See `PRODUCTION_READINESS_REPORT.md` for technical status
- See frontend `src/pages/Settings.tsx` for sandbox/live toggle UI

---

**Last Updated:** April 23, 2026  
**Status:** 85% Production Ready
