import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export type AppointmentType = 'aula_experimental' | 'avaliacao_fisica' | 'treino' | 'consulta' | 'outros';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Appointment {
  id: string;
  unit_id: string;
  lead_id: string | null;
  professor_id: string | null;
  type: AppointmentType;
  status: AppointmentStatus;
  title: string;
  description: string | null;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  lead?: { id: string; full_name: string; phone: string } | null;
  professor?: { id: string; full_name: string } | null;
}

export interface ProfessorAvailability {
  id: string;
  unit_id: string;
  professor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ScheduleBlock {
  id: string;
  unit_id: string;
  professor_id: string | null;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  all_day: boolean;
  reason: string | null;
}

export const appointmentTypeLabels: Record<AppointmentType, string> = {
  aula_experimental: 'Aula Experimental',
  avaliacao_fisica: 'Avaliação Física',
  treino: 'Treino',
  consulta: 'Consulta',
  outros: 'Outros',
};

export const appointmentStatusLabels: Record<AppointmentStatus, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não Compareceu',
};

export const dayOfWeekLabels = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

// Appointments
export function useAppointments(date?: string, professorId?: string) {
  return useQuery({
    queryKey: ['appointments', date, professorId],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('*, lead:leads(id, full_name, phone)')
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (date) {
        query = query.eq('scheduled_date', date);
      }

      if (professorId) {
        query = query.eq('professor_id', professorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Appointment[];
    },
  });
}

export function useAppointmentsByRange(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['appointments-range', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, lead:leads(id, full_name, phone)')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<Appointment, 'id' | 'created_at' | 'lead' | 'professor'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-range'] });
      logActivity({
        entity_type: 'appointment',
        entity_id: data.id,
        action: 'create',
        description: `Agendamento "${data.title}" criado para ${data.scheduled_date}`,
        metadata: { title: data.title, date: data.scheduled_date, type: data.type },
      });
      toast({ title: 'Agendamento criado', description: 'O agendamento foi realizado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar agendamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-range'] });
      logActivity({
        entity_type: 'appointment',
        entity_id: data.id,
        action: 'update',
        description: `Agendamento "${data.title}" atualizado`,
        metadata: { title: data.title, status: data.status },
      });
      toast({ title: 'Agendamento atualizado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar agendamento', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled', 
          cancelled_at: new Date().toISOString(),
          cancelled_reason: reason || null 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-range'] });
      logActivity({
        entity_type: 'appointment',
        entity_id: data.id,
        action: 'status_change',
        description: `Agendamento "${data.title}" cancelado`,
        metadata: { title: data.title, cancelled_reason: data.cancelled_reason },
      });
      toast({ title: 'Agendamento cancelado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao cancelar', description: error.message, variant: 'destructive' });
    },
  });
}

// Professor Availability
export function useProfessorAvailability(professorId?: string) {
  return useQuery({
    queryKey: ['professor-availability', professorId],
    queryFn: async () => {
      let query = supabase
        .from('professor_availability')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (professorId) {
        query = query.eq('professor_id', professorId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProfessorAvailability[];
    },
  });
}

export function useCreateAvailability() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<ProfessorAvailability, 'id'>) => {
      const { data, error } = await supabase
        .from('professor_availability')
        .insert(input)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-availability'] });
      toast({ title: 'Disponibilidade adicionada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('professor_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professor-availability'] });
    },
  });
}

// Schedule Blocks
export function useScheduleBlocks(date?: string) {
  return useQuery({
    queryKey: ['schedule-blocks', date],
    queryFn: async () => {
      let query = supabase
        .from('schedule_blocks')
        .select('*')
        .order('block_date', { ascending: true });

      if (date) {
        query = query.eq('block_date', date);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ScheduleBlock[];
    },
  });
}

// Appointments Stats
export function useAppointmentStats() {
  return useQuery({
    queryKey: ['appointment-stats'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [todayResult, pendingResult, completedResult] = await Promise.all([
        supabase
          .from('appointments')
          .select('id')
          .eq('scheduled_date', today)
          .in('status', ['scheduled', 'confirmed']),
        supabase
          .from('appointments')
          .select('id')
          .in('status', ['scheduled', 'confirmed']),
        supabase
          .from('appointments')
          .select('id')
          .eq('status', 'completed'),
      ]);

      return {
        todayCount: todayResult.data?.length || 0,
        pendingCount: pendingResult.data?.length || 0,
        completedCount: completedResult.data?.length || 0,
      };
    },
  });
}
