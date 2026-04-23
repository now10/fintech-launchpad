import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useBusiness } from './useBusinessData';

export function useManagePaymentPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      action: 'create' | 'cancel';
      plan_id?: string;
      customer_id?: string;
      mandate_id?: string;
      amount?: number;
      currency?: string;
      frequency?: string;
      start_date?: string;
      end_date?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('manage-payment-plan', { body: input });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['payment_plans'] }),
  });
}

export function useMandateLinks() {
  const { data: business } = useBusiness();
  return useQuery({
    queryKey: ['mandate_links', business?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mandate_authorization_tokens')
        .select('*')
        .eq('business_id', business!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!business?.id,
  });
}

export function useCreateMandateLink() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { customer_email: string; customer_name: string; scheme?: string; customer_id?: string }) => {
      const { data, error } = await supabase.functions.invoke('create-mandate-link', { body: input });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { url: string; token: string; expires_at: string; business_name: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['mandate_links'] }),
  });
}
