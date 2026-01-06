import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export interface ClassType {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  max_capacity: number;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface ClassSchedule {
  id: string;
  unit_id: string;
  class_type_id: string;
  professor_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  max_capacity: number | null;
  location: string | null;
  is_active: boolean;
  class_type?: ClassType;
  professor?: { id: string; full_name: string };
}

export interface ClassSession {
  id: string;
  unit_id: string;
  class_type_id: string;
  class_schedule_id: string | null;
  professor_id: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_enrollments: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  location: string | null;
  notes: string | null;
  cancelled_reason: string | null;
  class_type?: ClassType;
  professor?: { id: string; full_name: string };
}

export interface ClassEnrollment {
  id: string;
  unit_id: string;
  class_session_id: string;
  lead_id: string;
  status: 'enrolled' | 'confirmed' | 'attended' | 'no_show' | 'cancelled';
  enrolled_at: string;
  confirmed_at: string | null;
  checked_in_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  lead?: { id: string; full_name: string; phone: string };
  class_session?: ClassSession;
}

export interface ClassWaitlist {
  id: string;
  unit_id: string;
  class_session_id: string;
  lead_id: string;
  position: number;
  added_at: string;
  notified_at: string | null;
  expired_at: string | null;
  status: 'waiting' | 'notified' | 'enrolled' | 'expired' | 'cancelled';
  lead?: { id: string; full_name: string; phone: string };
}

export const dayOfWeekLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Class Types
export function useClassTypes() {
  return useQuery({
    queryKey: ['class-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as ClassType[];
    },
  });
}

export function useCreateClassType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<ClassType, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('class_types')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      logActivity({
        entity_type: 'class_type',
        entity_id: data.id,
        action: 'create',
        description: `Modalidade "${data.name}" criada`,
        metadata: { name: data.name },
      });
      toast({ title: 'Modalidade criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar modalidade', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClassType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ClassType> & { id: string }) => {
      const { data, error } = await supabase
        .from('class_types')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      toast({ title: 'Modalidade atualizada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClassType() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('class_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-types'] });
      toast({ title: 'Modalidade excluída!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    },
  });
}

// Class Schedules
export function useClassSchedules() {
  return useQuery({
    queryKey: ['class-schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_schedules')
        .select('*, class_type:class_types(*), professor:profiles!class_schedules_professor_id_fkey(id, full_name)')
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');
      if (error) throw error;
      return data as ClassSchedule[];
    },
  });
}

export function useCreateClassSchedule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<ClassSchedule, 'id' | 'class_type' | 'professor'>) => {
      const { data, error } = await supabase
        .from('class_schedules')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
      toast({ title: 'Horário de aula criado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar horário', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteClassSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('class_schedules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-schedules'] });
    },
  });
}

// Class Sessions
export function useClassSessions(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['class-sessions', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('class_sessions')
        .select('*, class_type:class_types(*), professor:profiles!class_sessions_professor_id_fkey(id, full_name)')
        .order('session_date')
        .order('start_time');
      
      if (startDate) query = query.gte('session_date', startDate);
      if (endDate) query = query.lte('session_date', endDate);
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ClassSession[];
    },
    enabled: !!startDate || !!endDate,
  });
}

export function useClassSessionsByDate(date: string) {
  return useQuery({
    queryKey: ['class-sessions', date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_sessions')
        .select('*, class_type:class_types(*), professor:profiles!class_sessions_professor_id_fkey(id, full_name)')
        .eq('session_date', date)
        .order('start_time');
      if (error) throw error;
      return data as ClassSession[];
    },
    enabled: !!date,
  });
}

export function useCreateClassSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<ClassSession, 'id' | 'current_enrollments' | 'class_type' | 'professor' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      toast({ title: 'Aula criada com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar aula', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateClassSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ClassSession> & { id: string }) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      toast({ title: 'Aula atualizada!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelClassSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('class_sessions')
        .update({ status: 'cancelled', cancelled_reason: reason })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      toast({ title: 'Aula cancelada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    },
  });
}

// Class Enrollments
export function useClassEnrollments(sessionId: string) {
  return useQuery({
    queryKey: ['class-enrollments', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .select('*, lead:leads(id, full_name, phone)')
        .eq('class_session_id', sessionId)
        .order('enrolled_at');
      if (error) throw error;
      return data as ClassEnrollment[];
    },
    enabled: !!sessionId,
  });
}

export function useMyEnrollments() {
  return useQuery({
    queryKey: ['my-enrollments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get lead id for this user
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return [];

      const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!lead) return [];

      const { data, error } = await supabase
        .from('class_enrollments')
        .select('*, class_session:class_sessions(*, class_type:class_types(*))')
        .eq('lead_id', lead.id)
        .in('status', ['enrolled', 'confirmed'])
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as ClassEnrollment[];
    },
  });
}

export function useEnrollInClass() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ sessionId, leadId, unitId }: { sessionId: string; leadId: string; unitId: string }) => {
      // Check if session has capacity
      const { data: session } = await supabase
        .from('class_sessions')
        .select('max_capacity, current_enrollments')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Aula não encontrada');
      
      if (session.current_enrollments >= session.max_capacity) {
        // Add to waitlist instead
        const { data: waitlistCount } = await supabase
          .from('class_waitlist')
          .select('position')
          .eq('class_session_id', sessionId)
          .order('position', { ascending: false })
          .limit(1);
        
        const nextPosition = (waitlistCount?.[0]?.position || 0) + 1;
        
        const { data, error } = await supabase
          .from('class_waitlist')
          .insert({
            unit_id: unitId,
            class_session_id: sessionId,
            lead_id: leadId,
            position: nextPosition,
          })
          .select()
          .single();
        
        if (error) throw error;
        return { type: 'waitlist', data, position: nextPosition };
      }

      // Enroll directly
      const { data, error } = await supabase
        .from('class_enrollments')
        .insert({
          unit_id: unitId,
          class_session_id: sessionId,
          lead_id: leadId,
        })
        .select()
        .single();

      if (error) throw error;
      return { type: 'enrolled', data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['class-waitlist'] });
      
      if (result.type === 'waitlist') {
        toast({ 
          title: 'Adicionado à lista de espera',
          description: `Você está na posição ${result.position}. Será notificado se uma vaga abrir.`
        });
      } else {
        toast({ title: 'Inscrição realizada com sucesso!' });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao inscrever', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
          cancellation_reason: reason 
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['class-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
      toast({ title: 'Inscrição cancelada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCheckInEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .update({ 
          status: 'attended', 
          checked_in_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      toast({ title: 'Check-in realizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro no check-in', description: error.message, variant: 'destructive' });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('class_enrollments')
        .update({ status: 'no_show' })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-enrollments'] });
      toast({ title: 'Marcado como falta' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    },
  });
}

// Waitlist
export function useClassWaitlist(sessionId: string) {
  return useQuery({
    queryKey: ['class-waitlist', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('class_waitlist')
        .select('*, lead:leads(id, full_name, phone)')
        .eq('class_session_id', sessionId)
        .eq('status', 'waiting')
        .order('position');
      if (error) throw error;
      return data as ClassWaitlist[];
    },
    enabled: !!sessionId,
  });
}

export function useRemoveFromWaitlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('class_waitlist')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-waitlist'] });
    },
  });
}

// Stats
export function useClassStats() {
  return useQuery({
    queryKey: ['class-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [todaySessions, totalTypes, weekEnrollments] = await Promise.all([
        supabase
          .from('class_sessions')
          .select('id')
          .eq('session_date', today)
          .in('status', ['scheduled', 'in_progress']),
        supabase
          .from('class_types')
          .select('id')
          .eq('is_active', true),
        supabase
          .from('class_enrollments')
          .select('id')
          .gte('enrolled_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .in('status', ['enrolled', 'confirmed', 'attended']),
      ]);

      return {
        todayClasses: todaySessions.data?.length || 0,
        totalModalities: totalTypes.data?.length || 0,
        weekEnrollments: weekEnrollments.data?.length || 0,
      };
    },
  });
}
