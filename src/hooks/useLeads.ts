import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export type PipelineStatus = 'lead' | 'visita_agendada' | 'negociacao' | 'ativo' | 'inativo' | 'cancelado';

export interface Lead {
  id: string;
  unit_id: string;
  profile_id: string | null;
  full_name: string;
  email: string | null;
  phone: string;
  cpf: string | null;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  source: string | null;
  status: PipelineStatus;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateLeadInput {
  full_name: string;
  phone: string;
  email?: string;
  cpf?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  source?: string;
  notes?: string;
  assigned_to?: string;
}

export interface UpdateLeadInput extends Partial<CreateLeadInput> {
  status?: PipelineStatus;
}

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

export function useLeads(status?: PipelineStatus) {
  return useQuery({
    queryKey: ['leads', status],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Lead[];
    },
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Lead | null;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateLeadInput) => {
      const { data, error } = await supabase
        .from('leads')
        .insert({
          ...input,
          unit_id: DEFAULT_UNIT_ID,
          status: 'lead' as PipelineStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        entity_type: 'lead',
        entity_id: data.id,
        action: 'create',
        description: `Lead "${data.full_name}" cadastrado`,
        metadata: { lead_name: data.full_name, phone: data.phone },
      });
      toast({
        title: 'Lead cadastrado',
        description: 'O lead foi cadastrado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao cadastrar lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateLeadInput & { id: string }) => {
      const { data, error } = await supabase
        .from('leads')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        entity_type: 'lead',
        entity_id: data.id,
        action: 'update',
        description: `Lead "${data.full_name}" atualizado`,
        metadata: { lead_name: data.full_name },
      });
      toast({
        title: 'Lead atualizado',
        description: 'O lead foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Get lead name before deleting
      const { data: lead } = await supabase
        .from('leads')
        .select('full_name')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, name: lead?.full_name || 'Desconhecido' };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        entity_type: 'lead',
        entity_id: data.id,
        action: 'delete',
        description: `Lead "${data.name}" excluído`,
        metadata: { lead_name: data.name },
      });
      toast({
        title: 'Lead excluído',
        description: 'O lead foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir lead',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBulkDeleteLeads() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return ids.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Leads excluídos',
        description: `${count} leads foram excluídos com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao excluir leads',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useBulkUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: PipelineStatus }) => {
      const { error } = await supabase
        .from('leads')
        .update({ status })
        .in('id', ids);

      if (error) throw error;
      return { count: ids.length, status };
    },
    onSuccess: ({ count, status }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast({
        title: 'Status atualizados',
        description: `${count} leads foram movidos para "${getStatusLabel(status)}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PipelineStatus }) => {
      const { data, error } = await supabase
        .from('leads')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Lead;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      logActivity({
        entity_type: 'lead',
        entity_id: data.id,
        action: 'status_change',
        description: `Lead "${data.full_name}" movido para "${getStatusLabel(data.status)}"`,
        metadata: { lead_name: data.full_name, new_status: data.status },
      });
      toast({
        title: 'Status atualizado',
        description: `O lead foi movido para "${getStatusLabel(data.status)}".`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function getStatusLabel(status: PipelineStatus): string {
  const labels: Record<PipelineStatus, string> = {
    lead: 'Lead',
    visita_agendada: 'Visita Agendada',
    negociacao: 'Negociação',
    ativo: 'Ativo',
    inativo: 'Inativo',
    cancelado: 'Cancelado',
  };
  return labels[status];
}

// Birthday leads for this month
export function useBirthdayLeads() {
  return useQuery({
    queryKey: ['leads-birthdays'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .not('birth_date', 'is', null)
        .in('status', ['ativo', 'negociacao', 'visita_agendada'])
        .order('birth_date', { ascending: true });

      if (error) throw error;
      
      // Filter leads whose birth month matches current month
      const currentMonth = new Date().getMonth() + 1;
      const birthdayLeads = (data as Lead[]).filter(lead => {
        if (!lead.birth_date) return false;
        const birthMonth = new Date(lead.birth_date).getMonth() + 1;
        return birthMonth === currentMonth;
      });

      // Sort by day of month
      birthdayLeads.sort((a, b) => {
        const dayA = new Date(a.birth_date!).getDate();
        const dayB = new Date(b.birth_date!).getDate();
        return dayA - dayB;
      });

      return birthdayLeads;
    },
  });
}
