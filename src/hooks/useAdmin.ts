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
