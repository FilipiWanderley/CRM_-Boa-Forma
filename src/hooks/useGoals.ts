import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, format } from 'date-fns';

export interface Goal {
  id: string;
  unit_id: string;
  name: string;
  type: 'leads' | 'conversions' | 'revenue' | 'check_ins' | 'new_clients';
  target_value: number;
  current_value: number;
  period_type: 'monthly' | 'quarterly' | 'yearly';
  period_start: string;
  period_end: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalWithProgress extends Goal {
  progress: number;
  status: 'on_track' | 'at_risk' | 'behind' | 'completed';
}

export interface CreateGoalInput {
  name: string;
  type: Goal['type'];
  target_value: number;
  period_type: Goal['period_type'];
  period_start?: string;
  period_end?: string;
}

function getDefaultPeriodDates(periodType: Goal['period_type']) {
  const now = new Date();
  switch (periodType) {
    case 'monthly':
      return {
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(endOfMonth(now), 'yyyy-MM-dd')
      };
    case 'quarterly':
      return {
        start: format(startOfQuarter(now), 'yyyy-MM-dd'),
        end: format(endOfQuarter(now), 'yyyy-MM-dd')
      };
    case 'yearly':
      return {
        start: format(startOfYear(now), 'yyyy-MM-dd'),
        end: format(endOfYear(now), 'yyyy-MM-dd')
      };
  }
}

export function useGoals() {
  const { profile } = useAuth();
  const unitId = profile?.unit_id;
  const queryClient = useQueryClient();

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!unitId,
  });

  const { data: archivedGoals = [], isLoading: isLoadingArchived } = useQuery({
    queryKey: ['goals-archived', unitId],
    queryFn: async () => {
      if (!unitId) return [];
      
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('unit_id', unitId)
        .eq('is_active', false)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!unitId,
  });

  const { data: goalsWithProgress = [], isLoading: isLoadingProgress } = useQuery({
    queryKey: ['goals-with-progress', unitId, goals],
    queryFn: async () => {
      if (!unitId || goals.length === 0) return [];
      
      const enrichedGoals: GoalWithProgress[] = [];
      
      for (const goal of goals) {
        let currentValue = 0;
        
        // Calculate current value based on goal type
        switch (goal.type) {
          case 'leads': {
            const { count } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unitId)
              .gte('created_at', goal.period_start)
              .lte('created_at', goal.period_end);
            currentValue = count || 0;
            break;
          }
          case 'conversions': {
            const { count } = await supabase
              .from('leads')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unitId)
              .eq('status', 'ativo')
              .gte('updated_at', goal.period_start)
              .lte('updated_at', goal.period_end);
            currentValue = count || 0;
            break;
          }
          case 'revenue': {
            const { data: payments } = await supabase
              .from('payments')
              .select('amount')
              .eq('unit_id', unitId)
              .gte('paid_at', goal.period_start)
              .lte('paid_at', goal.period_end);
            currentValue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
            break;
          }
          case 'check_ins': {
            const { count } = await supabase
              .from('check_ins')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unitId)
              .gte('checked_in_at', goal.period_start)
              .lte('checked_in_at', goal.period_end);
            currentValue = count || 0;
            break;
          }
          case 'new_clients': {
            const { count } = await supabase
              .from('subscriptions')
              .select('*', { count: 'exact', head: true })
              .eq('unit_id', unitId)
              .eq('status', 'active')
              .gte('created_at', goal.period_start)
              .lte('created_at', goal.period_end);
            currentValue = count || 0;
            break;
          }
        }
        
        const progress = goal.target_value > 0 
          ? Math.min((currentValue / goal.target_value) * 100, 100) 
          : 0;
        
        // Determine status based on progress and time elapsed
        const periodStart = new Date(goal.period_start);
        const periodEnd = new Date(goal.period_end);
        const now = new Date();
        const totalDays = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24);
        const elapsedDays = Math.max(0, (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24));
        const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
        
        let status: GoalWithProgress['status'];
        if (progress >= 100) {
          status = 'completed';
        } else if (progress >= expectedProgress * 0.9) {
          status = 'on_track';
        } else if (progress >= expectedProgress * 0.7) {
          status = 'at_risk';
        } else {
          status = 'behind';
        }
        
        enrichedGoals.push({
          ...goal,
          current_value: currentValue,
          progress,
          status,
        });
      }
      
      return enrichedGoals;
    },
    enabled: !!unitId && goals.length > 0,
  });

  const createGoal = useMutation({
    mutationFn: async (input: CreateGoalInput) => {
      if (!unitId) throw new Error('Unit ID not found');
      
      const periodDates = input.period_start && input.period_end
        ? { start: input.period_start, end: input.period_end }
        : getDefaultPeriodDates(input.period_type);
      
      const { data, error } = await supabase
        .from('goals')
        .insert({
          unit_id: unitId,
          name: input.name,
          type: input.type,
          target_value: input.target_value,
          period_type: input.period_type,
          period_start: periodDates.start,
          period_end: periodDates.end,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta criada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar meta: ' + error.message);
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Goal> & { id: string }) => {
      const { data, error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Meta atualizada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar meta: ' + error.message);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-archived'] });
      toast.success('Meta excluída com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir meta: ' + error.message);
    },
  });

  const archiveGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-archived'] });
      toast.success('Meta arquivada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao arquivar meta: ' + error.message);
    },
  });

  const restoreGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('goals')
        .update({ is_active: true })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goals-archived'] });
      toast.success('Meta restaurada com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao restaurar meta: ' + error.message);
    },
  });

  return {
    goals: goalsWithProgress,
    archivedGoals,
    isLoading: isLoading || isLoadingProgress,
    isLoadingArchived,
    createGoal,
    updateGoal,
    deleteGoal,
    archiveGoal,
    restoreGoal,
  };
}
