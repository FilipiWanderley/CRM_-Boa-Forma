import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export interface ActivityLog {
  id: string;
  unit_id: string;
  user_id: string | null;
  entity_type: string;
  entity_id: string | null;
  action: string;
  description: string;
  metadata: Json;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user_name?: string;
}

interface CreateActivityLogInput {
  entity_type: string;
  entity_id?: string;
  action: string;
  description: string;
  metadata?: Json;
}

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

export function useActivityLogs(filters?: { 
  entity_type?: string; 
  action?: string; 
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['activity-logs', filters],
    queryFn: async () => {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom.toISOString());
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo.toISOString());
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      } else {
        query = query.limit(100);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ActivityLog[];
    },
  });
}

export function useCreateActivityLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateActivityLogInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('activity_logs')
        .insert([{
          entity_type: input.entity_type,
          entity_id: input.entity_id || null,
          action: input.action,
          description: input.description,
          metadata: input.metadata || {},
          unit_id: DEFAULT_UNIT_ID,
          user_id: user?.id || null,
          user_agent: navigator.userAgent,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

// Helper function to log activity
export async function logActivity(input: CreateActivityLogInput) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    await supabase
      .from('activity_logs')
      .insert([{
        entity_type: input.entity_type,
        entity_id: input.entity_id || null,
        action: input.action,
        description: input.description,
        metadata: input.metadata || {},
        unit_id: DEFAULT_UNIT_ID,
        user_id: user?.id || null,
        user_agent: navigator.userAgent,
      }]);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

export const ENTITY_TYPES = [
  { value: 'lead', label: 'Leads' },
  { value: 'invoice', label: 'Faturas' },
  { value: 'subscription', label: 'Assinaturas' },
  { value: 'workout', label: 'Treinos' },
  { value: 'contract', label: 'Contratos' },
  { value: 'user', label: 'Usuários' },
  { value: 'appointment', label: 'Agendamentos' },
  { value: 'auth', label: 'Autenticação' },
  { value: 'plan', label: 'Planos' },
  { value: 'payment', label: 'Pagamentos' },
];

export const ACTION_TYPES = [
  { value: 'create', label: 'Criação' },
  { value: 'update', label: 'Atualização' },
  { value: 'delete', label: 'Exclusão' },
  { value: 'status_change', label: 'Mudança de Status' },
  { value: 'login', label: 'Login' },
  { value: 'logout', label: 'Logout' },
  { value: 'export', label: 'Exportação' },
];
