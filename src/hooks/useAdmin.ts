import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useIsAdmin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['is_admin', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useAdminBusinesses() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'businesses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

export function useAdminWebhookEvents() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'webhook_events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
    refetchInterval: 30_000,
  });
}

export function useAdminFailedPayments() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'failed_payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .in('status', ['failed', 'cancelled'])
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

export function useAuditLog() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'audit_log'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

export function useAdminPendingBankAccounts() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'pending_bank_accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*, businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

export function useAdminPendingMandates() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'pending_mandates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandates')
        .select('*, customers(name, email), businesses(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

export function useAdminPendingPayouts() {
  const { data: isAdmin } = useIsAdmin();
  return useQuery({
    queryKey: ['admin', 'pending_payouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payouts')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!isAdmin,
  });
}

function useAdminUpdateRow(table: string, queryKey: string[]) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; changes: Record<string, unknown> }) => {
      const { data, error } = await supabase.from(table).update(input.changes).eq('id', input.id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });
}

export function useAdminUpdateBankAccount() {
  return useAdminUpdateRow('bank_accounts', ['admin', 'pending_bank_accounts']);
}

export function useAdminUpdateMandate() {
  return useAdminUpdateRow('mandates', ['admin', 'pending_mandates']);
}

export function useAdminUpdatePayout() {
  return useAdminUpdateRow('payouts', ['admin', 'pending_payouts']);
}
