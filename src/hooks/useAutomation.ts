import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type AutomationType = 'welcome' | 'renewal_reminder' | 'birthday' | 'overdue' | 'inactivity';
export type AutomationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface AutomationRule {
  id: string;
  unit_id: string;
  name: string;
  type: AutomationType;
  is_active: boolean;
  trigger_days: number | null;
  subject: string;
  message_template: string;
  channel: string;
  created_at: string;
  updated_at: string;
}

export interface AutomationLog {
  id: string;
  unit_id: string;
  rule_id: string | null;
  lead_id: string | null;
  type: AutomationType;
  channel: string;
  recipient: string;
  subject: string | null;
  message: string;
  status: AutomationStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export interface CreateRuleInput {
  unit_id: string;
  name: string;
  type: AutomationType;
  trigger_days?: number;
  subject: string;
  message_template: string;
  channel?: string;
}

export function useAutomationRules() {
  return useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('type', { ascending: true });

      if (error) throw error;
      return data as AutomationRule[];
    },
  });
}

export function useAutomationLogs(limit = 50) {
  return useQuery({
    queryKey: ['automation-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_logs')
        .select('*, leads(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateRuleInput) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: 'Regra criada',
        description: 'A automação foi configurada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AutomationRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('automation_rules')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: 'Regra atualizada',
        description: 'A automação foi atualizada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteAutomationRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({
        title: 'Regra excluída',
        description: 'A automação foi removida.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir regra',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSimulateAutomation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: {
      unit_id: string;
      rule_id?: string;
      lead_id: string;
      type: AutomationType;
      recipient: string;
      subject: string;
      message: string;
    }) => {
      // Simula o envio (na produção, chamaria uma edge function)
      const { data, error } = await supabase
        .from('automation_logs')
        .insert({
          unit_id: input.unit_id,
          rule_id: input.rule_id || null,
          lead_id: input.lead_id,
          type: input.type,
          channel: 'email',
          recipient: input.recipient,
          subject: input.subject,
          message: input.message,
          status: 'sent', // Simulado como enviado
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-logs'] });
      toast({
        title: 'Automação simulada',
        description: 'O disparo foi registrado no log.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na simulação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Labels e ícones
export const automationTypeLabels: Record<AutomationType, string> = {
  welcome: 'Boas-vindas',
  renewal_reminder: 'Lembrete de Renovação',
  birthday: 'Aniversário',
  overdue: 'Cobrança',
  inactivity: 'Inatividade',
};

export const automationTypeIcons: Record<AutomationType, string> = {
  welcome: '👋',
  renewal_reminder: '🔔',
  birthday: '🎂',
  overdue: '💰',
  inactivity: '😴',
};

export const automationStatusLabels: Record<AutomationStatus, string> = {
  pending: 'Pendente',
  sent: 'Enviado',
  failed: 'Falhou',
  cancelled: 'Cancelado',
};
