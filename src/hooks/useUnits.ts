import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Unit {
  id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  logo_url: string | null;
  primary_color: string | null;
  timezone: string | null;
  allow_entry_if_overdue: boolean | null;
  overdue_grace_days: number | null;
  inactivity_alert_days: number | null;
  is_active: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUnitInput {
  name: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  primary_color?: string;
  timezone?: string;
  allow_entry_if_overdue?: boolean;
  overdue_grace_days?: number;
  inactivity_alert_days?: number;
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Unit[];
    },
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ['unit', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      return data as Unit | null;
    },
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateUnitInput) => {
      const { data, error } = await supabase
        .from('units')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Unidade criada',
        description: 'A unidade foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar unidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<CreateUnitInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('units')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Unit;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: 'Unidade atualizada',
        description: 'A unidade foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar unidade',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useToggleUnitStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('units')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Unit;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
      toast({
        title: data.is_active ? 'Unidade ativada' : 'Unidade desativada',
        description: `A unidade foi ${data.is_active ? 'ativada' : 'desativada'} com sucesso.`,
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
