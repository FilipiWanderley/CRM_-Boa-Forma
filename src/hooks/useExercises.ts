import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  video_url: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateExerciseInput {
  name: string;
  description?: string;
  muscle_group?: string;
  video_url?: string;
  image_url?: string;
}

export const muscleGroups = [
  'Peito',
  'Costas',
  'Ombros',
  'Bíceps',
  'Tríceps',
  'Antebraço',
  'Abdômen',
  'Quadríceps',
  'Posterior',
  'Glúteos',
  'Panturrilha',
  'Cardio',
  'Funcional',
  'Alongamento',
];

export function useExercises(muscleGroup?: string) {
  return useQuery({
    queryKey: ['exercises', muscleGroup],
    queryFn: async () => {
      let query = supabase
        .from('exercises')
        .select('*')
        .order('muscle_group', { ascending: true })
        .order('name', { ascending: true });

      if (muscleGroup) {
        query = query.eq('muscle_group', muscleGroup);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Exercise[];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: 'Exercício criado',
        description: 'O exercício foi adicionado ao banco.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar exercício',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Exercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('exercises')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: 'Exercício atualizado',
        description: 'As alterações foram salvas.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar exercício',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast({
        title: 'Exercício excluído',
        description: 'O exercício foi removido do banco.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir exercício',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
