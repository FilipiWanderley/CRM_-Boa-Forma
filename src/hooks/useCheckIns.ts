import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export interface CheckIn {
  id: string;
  unit_id: string;
  lead_id: string;
  checked_in_at: string;
  method: string;
  device_id: string | null;
}

export function useCheckIns(leadId?: string, limit = 30) {
  return useQuery({
    queryKey: ['check-ins', leadId, limit],
    queryFn: async () => {
      let query = supabase
        .from('check_ins')
        .select('*')
        .order('checked_in_at', { ascending: false })
        .limit(limit);

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as CheckIn[];
    },
  });
}

export function useCreateCheckIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: { unit_id: string; lead_id: string; method?: string }) => {
      const { data, error } = await supabase
        .from('check_ins')
        .insert({
          unit_id: input.unit_id,
          lead_id: input.lead_id,
          method: input.method || 'qr_code',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['check-ins'] });
      logActivity({
        entity_type: 'check_in',
        entity_id: data.id,
        action: 'create',
        description: `Check-in registrado via ${variables.method || 'qr_code'}`,
        metadata: { lead_id: variables.lead_id, method: variables.method },
      });
      toast({
        title: 'Check-in realizado!',
        description: 'Entrada registrada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro no check-in',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCheckInStats(leadId: string) {
  return useQuery({
    queryKey: ['check-in-stats', leadId],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const { data, error } = await supabase
        .from('check_ins')
        .select('id, checked_in_at')
        .eq('lead_id', leadId)
        .gte('checked_in_at', startOfMonth.toISOString());

      if (error) throw error;
      
      return {
        thisMonth: data?.length || 0,
        lastCheckIn: data?.[0]?.checked_in_at || null,
      };
    },
    enabled: !!leadId,
  });
}

export function useTodayCheckIns() {
  return useQuery({
    queryKey: ['check-ins-today'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from('check_ins')
        .select(`
          *,
          lead:leads(id, full_name, phone, status)
        `)
        .gte('checked_in_at', today.toISOString())
        .order('checked_in_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}
