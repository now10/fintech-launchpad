
-- 1. Audit log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  actor_email text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  business_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_business ON public.audit_log(business_id);
CREATE INDEX idx_audit_log_actor ON public.audit_log(actor_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2. Mandate authorization tokens (public mandate flow)
CREATE TABLE public.mandate_authorization_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text NOT NULL UNIQUE,
  business_id uuid NOT NULL,
  customer_id uuid,
  customer_email text NOT NULL,
  customer_name text NOT NULL,
  scheme text NOT NULL DEFAULT 'sepa_core',
  status text NOT NULL DEFAULT 'pending',
  mandate_id uuid,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mat_token ON public.mandate_authorization_tokens(token);
CREATE INDEX idx_mat_business ON public.mandate_authorization_tokens(business_id);

ALTER TABLE public.mandate_authorization_tokens ENABLE ROW LEVEL SECURITY;

-- No client policies = service-role only. Business owners can SEE their own tokens though.
CREATE POLICY "Owners can view own mandate tokens"
ON public.mandate_authorization_tokens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()));

-- 3. payment_plans: add end_date for bounded subscriptions
ALTER TABLE public.payment_plans ADD COLUMN IF NOT EXISTS end_date date;

-- 4. Add 'admin' to app_role enum (already exists, but ensure)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'app_role' AND e.enumlabel = 'admin'
  ) THEN
    ALTER TYPE app_role ADD VALUE 'admin';
  END IF;
END$$;

-- 5. is_admin helper (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- 6. Audit log policies: admins read; nobody writes/updates/deletes from client
CREATE POLICY "Admins can read audit log"
ON public.audit_log FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "No client inserts on audit log"
ON public.audit_log FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "No client updates on audit log"
ON public.audit_log FOR UPDATE TO authenticated USING (false);

CREATE POLICY "No client deletes on audit log"
ON public.audit_log FOR DELETE TO authenticated USING (false);

-- 7. Admin read-only views into core tables (additive policies)
CREATE POLICY "Admins can view all businesses"
ON public.businesses FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all customers"
ON public.customers FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all mandates"
ON public.mandates FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all payments"
ON public.payments FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all payouts"
ON public.payouts FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view all payment plans"
ON public.payment_plans FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can view webhook events"
ON public.webhook_events FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

-- 8. Allow business owners to manage their own mandates (for the public flow on the backend, plus letting them cancel)
CREATE POLICY "Owners can update own mandates"
ON public.mandates FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = mandates.business_id AND b.owner_id = auth.uid()));

CREATE POLICY "Owners can delete own mandates"
ON public.mandates FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = mandates.business_id AND b.owner_id = auth.uid()));
