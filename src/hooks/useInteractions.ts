import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type InteractionType = 'ligacao' | 'whatsapp' | 'email' | 'presencial' | 'sistema';

export interface Interaction {
  id: string;
  lead_id: string;
  user_id: string | null;
  type: InteractionType;
  description: string;
  scheduled_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CreateInteractionInput {
  lead_id: string;
  type: InteractionType;
  description: string;
  scheduled_at?: string;
}

export function useInteractions(leadId: string) {
  return useQuery({
    queryKey: ['interactions', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('interactions')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Interaction[];
    },
    enabled: !!leadId,
  });
}

export function useCreateInteraction() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateInteractionInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('interactions')
        .insert({
          ...input,
          user_id: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Interaction;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['interactions', data.lead_id] });
      toast({
        title: 'Interação registrada',
        description: 'A interação foi registrada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao registrar interação',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function getInteractionTypeLabel(type: InteractionType): string {
  const labels: Record<InteractionType, string> = {
    ligacao: 'Ligação',
    whatsapp: 'WhatsApp',
    email: 'E-mail',
    presencial: 'Presencial',
    sistema: 'Sistema',
  };
  return labels[type];
}

export function getInteractionTypeIcon(type: InteractionType): string {
  const icons: Record<InteractionType, string> = {
    ligacao: '📞',
    whatsapp: '💬',
    email: '📧',
    presencial: '👤',
    sistema: '🤖',
  };
  return icons[type];
}
