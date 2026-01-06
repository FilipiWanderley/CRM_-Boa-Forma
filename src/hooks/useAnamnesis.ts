import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Anamnesis {
  id: string;
  lead_id: string;
  medical_conditions: string[] | null;
  objectives: string[] | null;
  physical_activity_history: string | null;
  injuries: string | null;
  medications: string | null;
  smoker: boolean | null;
  alcohol_consumption: string | null;
  stress_level: string | null;
  sleep_quality: string | null;
  observations: string | null;
  signed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnamnesisInput {
  lead_id: string;
  medical_conditions?: string[];
  objectives?: string[];
  physical_activity_history?: string;
  injuries?: string;
  medications?: string;
  smoker?: boolean;
  alcohol_consumption?: string;
  stress_level?: string;
  sleep_quality?: string;
  observations?: string;
}

export function useAnamnesis(leadId: string) {
  return useQuery({
    queryKey: ['anamnesis', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('anamnesis')
        .select('*')
        .eq('lead_id', leadId)
        .maybeSingle();

      if (error) throw error;
      return data as Anamnesis | null;
    },
    enabled: !!leadId,
  });
}

export function useCreateAnamnesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: AnamnesisInput) => {
      const { data, error } = await supabase
        .from('anamnesis')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data as Anamnesis;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', data.lead_id] });
      toast({
        title: 'Anamnese salva',
        description: 'A ficha de anamnese foi criada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao salvar anamnese',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateAnamnesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<AnamnesisInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('anamnesis')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Anamnesis;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', data.lead_id] });
      toast({
        title: 'Anamnese atualizada',
        description: 'A ficha de anamnese foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar anamnese',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSignAnamnesis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('anamnesis')
        .update({ signed_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Anamnesis;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['anamnesis', data.lead_id] });
      toast({
        title: 'Anamnese assinada',
        description: 'A ficha de anamnese foi assinada digitalmente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao assinar anamnese',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export const medicalConditionOptions = [
  'Hipertensão',
  'Diabetes',
  'Cardiopatia',
  'Asma',
  'Artrite/Artrose',
  'Osteoporose',
  'Depressão/Ansiedade',
  'Problemas de Coluna',
  'Obesidade',
  'Tireoide',
];

export const objectiveOptions = [
  'Perda de peso',
  'Ganho de massa muscular',
  'Condicionamento físico',
  'Flexibilidade',
  'Reabilitação',
  'Qualidade de vida',
  'Preparação para competição',
  'Fortalecimento',
  'Correção postural',
  'Redução de estresse',
];
