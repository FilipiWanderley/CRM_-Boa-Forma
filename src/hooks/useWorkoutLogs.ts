import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WorkoutLog {
  id: string;
  unit_id: string;
  lead_id: string;
  workout_id: string;
  workout_exercise_id: string;
  completed_at: string;
  sets_completed: number | null;
  reps_completed: string | null;
  load_used: number | null;
  notes: string | null;
  created_at: string;
}

export interface CreateWorkoutLogInput {
  unit_id: string;
  lead_id: string;
  workout_id: string;
  workout_exercise_id: string;
  sets_completed?: number;
  reps_completed?: string;
  load_used?: number;
  notes?: string;
}

// Fetch logs for a specific workout session (today)
export function useTodayWorkoutLogs(workoutId: string | undefined, leadId: string | undefined) {
  return useQuery({
    queryKey: ['workout-logs-today', workoutId, leadId],
    queryFn: async () => {
      if (!workoutId || !leadId) return [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('workout_id', workoutId)
        .eq('lead_id', leadId)
        .gte('completed_at', today.toISOString())
        .lt('completed_at', tomorrow.toISOString());

      if (error) throw error;
      return data as WorkoutLog[];
    },
    enabled: !!workoutId && !!leadId,
  });
}

// Fetch all logs for a lead (for history)
export function useWorkoutLogs(leadId: string | undefined) {
  return useQuery({
    queryKey: ['workout-logs', leadId],
    queryFn: async () => {
      if (!leadId) return [];

      const { data, error } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('lead_id', leadId)
        .order('completed_at', { ascending: false });

      if (error) throw error;
      return data as WorkoutLog[];
    },
    enabled: !!leadId,
  });
}

// Get workout completion stats
export function useWorkoutStats(leadId: string | undefined) {
  return useQuery({
    queryKey: ['workout-stats', leadId],
    queryFn: async () => {
      if (!leadId) return null;

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Get unique workout days this month
      const { data: monthLogs, error: monthError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('lead_id', leadId)
        .gte('completed_at', startOfMonth.toISOString());

      if (monthError) throw monthError;

      // Get unique workout days this week
      const { data: weekLogs, error: weekError } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('lead_id', leadId)
        .gte('completed_at', startOfWeek.toISOString());

      if (weekError) throw weekError;

      // Count unique days
      const uniqueMonthDays = new Set(
        (monthLogs || []).map(log => 
          new Date(log.completed_at).toDateString()
        )
      ).size;

      const uniqueWeekDays = new Set(
        (weekLogs || []).map(log => 
          new Date(log.completed_at).toDateString()
        )
      ).size;

      return {
        workoutsThisMonth: uniqueMonthDays,
        workoutsThisWeek: uniqueWeekDays,
        exercisesThisMonth: monthLogs?.length || 0,
      };
    },
    enabled: !!leadId,
  });
}

export function useLogExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateWorkoutLogInput) => {
      const { data, error } = await supabase
        .from('workout_logs')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-logs-today', variables.workout_id, variables.lead_id] 
      });
      queryClient.invalidateQueries({ queryKey: ['workout-logs', variables.lead_id] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats', variables.lead_id] });
    },
    onError: (error: any) => {
      console.error('Error logging exercise:', error);
      toast({
        title: 'Erro ao registrar',
        description: 'Não foi possível marcar o exercício como concluído.',
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveExerciseLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ logId, workoutId, leadId }: { logId: string; workoutId: string; leadId: string }) => {
      const { error } = await supabase
        .from('workout_logs')
        .delete()
        .eq('id', logId);

      if (error) throw error;
      return { workoutId, leadId };
    },
    onSuccess: (variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['workout-logs-today', variables.workoutId, variables.leadId] 
      });
      queryClient.invalidateQueries({ queryKey: ['workout-logs', variables.leadId] });
      queryClient.invalidateQueries({ queryKey: ['workout-stats', variables.leadId] });
    },
  });
}
