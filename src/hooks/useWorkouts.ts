import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export interface ExerciseInfo {
  id: string;
  name: string;
  video_url: string | null;
  image_url: string | null;
}

export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_id: string | null;
  exercise_name: string;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  notes: string | null;
  order_index: number;
  load_value: number | null;
  load_unit: string | null;
  advanced_technique: string | null;
  exercise?: ExerciseInfo | null;
}

export interface Workout {
  id: string;
  unit_id: string;
  lead_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  workout_exercises?: WorkoutExercise[];
}

export interface CreateWorkoutInput {
  unit_id: string;
  lead_id: string;
  name: string;
  description?: string;
  valid_from?: string;
  valid_until?: string;
}

export interface CreateExerciseInput {
  workout_id: string;
  exercise_name: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
  order_index?: number;
}

export function useWorkouts(leadId?: string) {
  return useQuery({
    queryKey: ['workouts', leadId],
    queryFn: async () => {
      let query = supabase
        .from('workouts')
        .select('*, workout_exercises(*, exercise:exercises(id, name, video_url, image_url))')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (leadId) {
        query = query.eq('lead_id', leadId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Workout[];
    },
  });
}

export function useCreateWorkout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateWorkoutInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('workouts')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      logActivity({
        entity_type: 'workout',
        entity_id: data.id,
        action: 'create',
        description: `Treino "${data.name}" criado`,
        metadata: { workout_name: data.name, lead_id: data.lead_id },
      });
      toast({
        title: 'Treino criado',
        description: 'A ficha de treino foi criada com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar treino',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddExerciseToWorkout() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateExerciseInput) => {
      const { data, error } = await supabase
        .from('workout_exercises')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
      toast({
        title: 'Exercício adicionado',
        description: 'O exercício foi adicionado à ficha.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar exercício',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteWorkoutExercise() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', exerciseId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workouts'] });
    },
  });
}
