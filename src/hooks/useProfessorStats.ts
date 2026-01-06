import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useProfessorStats() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['professor-stats', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return null;
      
      // Get students assigned to this professor (leads with assigned_to = profile.id)
      // Or students who have workouts created by this professor
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id, lead_id, is_active')
        .eq('created_by', profile.user_id);
      
      if (workoutsError) throw workoutsError;
      
      // Get unique lead IDs from workouts
      const leadIds = [...new Set(workouts?.map(w => w.lead_id) || [])];
      
      // Get active students count
      let activeStudents = 0;
      if (leadIds.length > 0) {
        const { count, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .in('id', leadIds)
          .eq('status', 'ativo');
        
        if (leadsError) throw leadsError;
        activeStudents = count || 0;
      }
      
      // Count active workouts
      const activeWorkouts = workouts?.filter(w => w.is_active).length || 0;
      
      // Get total workouts
      const totalWorkouts = workouts?.length || 0;
      
      // Get students list for the professor
      let students: any[] = [];
      if (leadIds.length > 0) {
        const { data: leadsData, error: leadsDataError } = await supabase
          .from('leads')
          .select('*')
          .in('id', leadIds)
          .order('full_name');
        
        if (leadsDataError) throw leadsDataError;
        students = leadsData || [];
      }
      
      // Get pending assessments (appointments of type avaliacao_fisica for this professor)
      const { count: pendingAssessments, error: assessmentsError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('professor_id', profile.id)
        .eq('type', 'avaliacao_fisica')
        .eq('status', 'scheduled');
      
      if (assessmentsError) throw assessmentsError;
      
      return {
        activeStudents,
        totalWorkouts,
        activeWorkouts,
        totalStudents: leadIds.length,
        students,
        pendingAssessments: pendingAssessments || 0,
      };
    },
    enabled: !!profile?.id,
  });
}

// Hook to get students for the professor
export function useProfessorStudents() {
  const { profile } = useAuth();
  
  return useQuery({
    queryKey: ['professor-students', profile?.id],
    queryFn: async () => {
      if (!profile?.user_id) return [];
      
      // Get leads that have workouts created by this professor
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('lead_id')
        .eq('created_by', profile.user_id);
      
      if (workoutsError) throw workoutsError;
      
      const leadIds = [...new Set(workouts?.map(w => w.lead_id) || [])];
      
      if (leadIds.length === 0) return [];
      
      // Get leads data with their latest workout info
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select(`
          *,
          workouts:workouts(id, name, is_active, created_at),
          subscriptions:subscriptions(id, status, end_date, plan:plans(name))
        `)
        .in('id', leadIds)
        .order('full_name');
      
      if (leadsError) throw leadsError;
      
      return leads || [];
    },
    enabled: !!profile?.user_id,
  });
}