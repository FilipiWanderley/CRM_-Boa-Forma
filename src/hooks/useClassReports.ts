import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfMonth, startOfYear, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ClassReportPeriod = '7d' | '30d' | '90d' | 'month' | '3months' | '6months' | 'year';

export interface ClassReportFilters {
  period: ClassReportPeriod;
  classTypeId?: string;
  professorId?: string;
}

function getDateRange(period: ClassReportPeriod) {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = subDays(now, 7);
      break;
    case '30d':
      startDate = subDays(now, 30);
      break;
    case '90d':
      startDate = subDays(now, 90);
      break;
    case 'month':
      startDate = startOfMonth(now);
      break;
    case '3months':
      startDate = subDays(now, 90);
      break;
    case '6months':
      startDate = subDays(now, 180);
      break;
    case 'year':
      startDate = startOfYear(now);
      break;
    default:
      startDate = subDays(now, 30);
  }

  return {
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(now, 'yyyy-MM-dd'),
  };
}

export function useClassReport(filters: ClassReportFilters) {
  return useQuery({
    queryKey: ['class-report', filters],
    queryFn: async () => {
      const { startDate, endDate } = getDateRange(filters.period);

      // Fetch class sessions
      let sessionsQuery = supabase
        .from('class_sessions')
        .select('*, class_type:class_types(id, name, color)')
        .gte('session_date', startDate)
        .lte('session_date', endDate);

      if (filters.classTypeId) {
        sessionsQuery = sessionsQuery.eq('class_type_id', filters.classTypeId);
      }
      if (filters.professorId) {
        sessionsQuery = sessionsQuery.eq('professor_id', filters.professorId);
      }

      const { data: sessions, error: sessionsError } = await sessionsQuery;
      if (sessionsError) throw sessionsError;

      // Fetch enrollments for these sessions
      const sessionIds = sessions?.map(s => s.id) || [];
      let enrollmentsData: any[] = [];
      
      if (sessionIds.length > 0) {
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('class_enrollments')
          .select('*')
          .in('class_session_id', sessionIds);
        
        if (enrollmentsError) throw enrollmentsError;
        enrollmentsData = enrollments || [];
      }

      // Calculate metrics
      const totalSessions = sessions?.filter(s => s.status !== 'cancelled').length || 0;
      const cancelledSessions = sessions?.filter(s => s.status === 'cancelled').length || 0;
      const completedSessions = sessions?.filter(s => s.status === 'completed').length || 0;

      const totalCapacity = sessions?.reduce((acc, s) => s.status !== 'cancelled' ? acc + s.max_capacity : acc, 0) || 0;
      const totalEnrollments = enrollmentsData.filter(e => e.status !== 'cancelled').length;
      const totalAttendances = enrollmentsData.filter(e => e.status === 'attended').length;
      const totalNoShows = enrollmentsData.filter(e => e.status === 'no_show').length;

      const occupancyRate = totalCapacity > 0 ? (totalEnrollments / totalCapacity) * 100 : 0;
      const attendanceRate = totalEnrollments > 0 ? (totalAttendances / totalEnrollments) * 100 : 0;
      const noShowRate = totalEnrollments > 0 ? (totalNoShows / totalEnrollments) * 100 : 0;

      // Stats by class type
      const classTypeStats = new Map<string, { 
        name: string; 
        color: string;
        sessions: number; 
        enrollments: number; 
        attendances: number;
        noShows: number;
        capacity: number;
      }>();

      sessions?.filter(s => s.status !== 'cancelled').forEach(session => {
        const classType = session.class_type as any;
        const key = classType?.id || 'unknown';
        const existing = classTypeStats.get(key) || {
          name: classType?.name || 'Desconhecido',
          color: classType?.color || '#6b7280',
          sessions: 0,
          enrollments: 0,
          attendances: 0,
          noShows: 0,
          capacity: 0,
        };
        
        existing.sessions += 1;
        existing.capacity += session.max_capacity;
        
        const sessionEnrollments = enrollmentsData.filter(e => e.class_session_id === session.id);
        existing.enrollments += sessionEnrollments.filter(e => e.status !== 'cancelled').length;
        existing.attendances += sessionEnrollments.filter(e => e.status === 'attended').length;
        existing.noShows += sessionEnrollments.filter(e => e.status === 'no_show').length;
        
        classTypeStats.set(key, existing);
      });

      const byClassType = Array.from(classTypeStats.entries()).map(([id, stats]) => ({
        id,
        name: stats.name,
        color: stats.color,
        sessions: stats.sessions,
        enrollments: stats.enrollments,
        attendances: stats.attendances,
        noShows: stats.noShows,
        capacity: stats.capacity,
        occupancyRate: stats.capacity > 0 ? (stats.enrollments / stats.capacity) * 100 : 0,
        attendanceRate: stats.enrollments > 0 ? (stats.attendances / stats.enrollments) * 100 : 0,
        noShowRate: stats.enrollments > 0 ? (stats.noShows / stats.enrollments) * 100 : 0,
      })).sort((a, b) => b.enrollments - a.enrollments);

      // Daily trend
      const dailyTrendMap = new Map<string, { date: string; sessions: number; enrollments: number; attendances: number }>();
      
      sessions?.filter(s => s.status !== 'cancelled').forEach(session => {
        const date = session.session_date;
        const existing = dailyTrendMap.get(date) || { date, sessions: 0, enrollments: 0, attendances: 0 };
        existing.sessions += 1;
        
        const sessionEnrollments = enrollmentsData.filter(e => e.class_session_id === session.id);
        existing.enrollments += sessionEnrollments.filter(e => e.status !== 'cancelled').length;
        existing.attendances += sessionEnrollments.filter(e => e.status === 'attended').length;
        
        dailyTrendMap.set(date, existing);
      });

      const dailyTrend = Array.from(dailyTrendMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          ...d,
          date: format(parseISO(d.date), 'dd/MM', { locale: ptBR }),
        }));

      // Day of week stats
      const dayOfWeekMap = new Map<number, { day: number; sessions: number; enrollments: number }>();
      
      sessions?.filter(s => s.status !== 'cancelled').forEach(session => {
        const dayOfWeek = parseISO(session.session_date).getDay();
        const existing = dayOfWeekMap.get(dayOfWeek) || { day: dayOfWeek, sessions: 0, enrollments: 0 };
        existing.sessions += 1;
        
        const sessionEnrollments = enrollmentsData.filter(e => e.class_session_id === session.id && e.status !== 'cancelled');
        existing.enrollments += sessionEnrollments.length;
        
        dayOfWeekMap.set(dayOfWeek, existing);
      });

      const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const byDayOfWeek = Array.from(dayOfWeekMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([day, stats]) => ({
          ...stats,
          dayName: dayLabels[day],
        }));

      // Time of day stats
      const hourMap = new Map<number, { hour: number; sessions: number; enrollments: number }>();
      
      sessions?.filter(s => s.status !== 'cancelled').forEach(session => {
        const hour = parseInt(session.start_time.split(':')[0], 10);
        const existing = hourMap.get(hour) || { hour, sessions: 0, enrollments: 0 };
        existing.sessions += 1;
        
        const sessionEnrollments = enrollmentsData.filter(e => e.class_session_id === session.id && e.status !== 'cancelled');
        existing.enrollments += sessionEnrollments.length;
        
        hourMap.set(hour, existing);
      });

      const byHour = Array.from(hourMap.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([hour, stats]) => ({
          ...stats,
          hourLabel: `${hour.toString().padStart(2, '0')}h`,
        }));

      return {
        // Summary KPIs
        totalSessions,
        cancelledSessions,
        completedSessions,
        totalEnrollments,
        totalAttendances,
        totalNoShows,
        totalCapacity,
        occupancyRate,
        attendanceRate,
        noShowRate,
        // Breakdown data
        byClassType,
        dailyTrend,
        byDayOfWeek,
        byHour,
      };
    },
  });
}
