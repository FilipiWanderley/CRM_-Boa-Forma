import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, getDay, getHours, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Comparativo de períodos
export interface PeriodComparison {
  currentPeriod: {
    revenue: number;
    leads: number;
    conversions: number;
    churn: number;
    checkIns: number;
  };
  previousPeriod: {
    revenue: number;
    leads: number;
    conversions: number;
    churn: number;
    checkIns: number;
  };
  percentageChanges: {
    revenue: number;
    leads: number;
    conversions: number;
    churn: number;
    checkIns: number;
  };
}

export function usePeriodComparison(monthsBack: number = 1) {
  return useQuery({
    queryKey: ['period-comparison', monthsBack],
    queryFn: async (): Promise<PeriodComparison> => {
      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = endOfMonth(now);
      const previousStart = startOfMonth(subMonths(now, monthsBack));
      const previousEnd = endOfMonth(subMonths(now, monthsBack));

      // Fetch invoices for revenue
      const { data: currentInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', currentStart.toISOString())
        .lte('paid_at', currentEnd.toISOString());

      const { data: previousInvoices } = await supabase
        .from('invoices')
        .select('amount')
        .eq('status', 'paid')
        .gte('paid_at', previousStart.toISOString())
        .lte('paid_at', previousEnd.toISOString());

      // Fetch leads
      const { data: currentLeads } = await supabase
        .from('leads')
        .select('id, status')
        .gte('created_at', currentStart.toISOString())
        .lte('created_at', currentEnd.toISOString());

      const { data: previousLeads } = await supabase
        .from('leads')
        .select('id, status')
        .gte('created_at', previousStart.toISOString())
        .lte('created_at', previousEnd.toISOString());

      // Fetch check-ins
      const { data: currentCheckIns } = await supabase
        .from('check_ins')
        .select('id')
        .gte('checked_in_at', currentStart.toISOString())
        .lte('checked_in_at', currentEnd.toISOString());

      const { data: previousCheckIns } = await supabase
        .from('check_ins')
        .select('id')
        .gte('checked_in_at', previousStart.toISOString())
        .lte('checked_in_at', previousEnd.toISOString());

      // Calculate metrics
      const currentRevenue = currentInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      const previousRevenue = previousInvoices?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;
      
      const currentLeadsCount = currentLeads?.length || 0;
      const previousLeadsCount = previousLeads?.length || 0;
      
      const currentConversions = currentLeads?.filter(l => l.status === 'ativo').length || 0;
      const previousConversions = previousLeads?.filter(l => l.status === 'ativo').length || 0;
      
      const currentChurn = currentLeads?.filter(l => l.status === 'cancelado' || l.status === 'inativo').length || 0;
      const previousChurn = previousLeads?.filter(l => l.status === 'cancelado' || l.status === 'inativo').length || 0;

      const currentCheckInsCount = currentCheckIns?.length || 0;
      const previousCheckInsCount = previousCheckIns?.length || 0;

      const calcChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        currentPeriod: {
          revenue: currentRevenue,
          leads: currentLeadsCount,
          conversions: currentConversions,
          churn: currentChurn,
          checkIns: currentCheckInsCount,
        },
        previousPeriod: {
          revenue: previousRevenue,
          leads: previousLeadsCount,
          conversions: previousConversions,
          churn: previousChurn,
          checkIns: previousCheckInsCount,
        },
        percentageChanges: {
          revenue: calcChange(currentRevenue, previousRevenue),
          leads: calcChange(currentLeadsCount, previousLeadsCount),
          conversions: calcChange(currentConversions, previousConversions),
          churn: calcChange(currentChurn, previousChurn),
          checkIns: calcChange(currentCheckInsCount, previousCheckInsCount),
        },
      };
    },
  });
}

// Mapa de calor - Grade semanal
export interface HeatmapCell {
  day: number; // 0-6 (domingo-sábado)
  hour: number; // 0-23
  count: number;
  dayName: string;
}

export function useWeeklyHeatmap() {
  return useQuery({
    queryKey: ['weekly-heatmap'],
    queryFn: async (): Promise<HeatmapCell[]> => {
      const thirtyDaysAgo = subMonths(new Date(), 1);
      
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .gte('checked_in_at', thirtyDaysAgo.toISOString());

      const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const heatmap: HeatmapCell[] = [];

      // Initialize all cells
      for (let day = 0; day < 7; day++) {
        for (let hour = 5; hour <= 22; hour++) {
          heatmap.push({ day, hour, count: 0, dayName: dayNames[day] });
        }
      }

      // Count check-ins per cell
      checkIns?.forEach(checkIn => {
        const date = parseISO(checkIn.checked_in_at);
        const day = getDay(date);
        const hour = getHours(date);
        
        if (hour >= 5 && hour <= 22) {
          const cell = heatmap.find(c => c.day === day && c.hour === hour);
          if (cell) cell.count++;
        }
      });

      return heatmap;
    },
  });
}

// Mapa de calor - Calendário mensal
export interface MonthlyHeatmapCell {
  date: string;
  count: number;
  dayOfMonth: number;
}

export function useMonthlyHeatmap(year: number, month: number) {
  return useQuery({
    queryKey: ['monthly-heatmap', year, month],
    queryFn: async (): Promise<MonthlyHeatmapCell[]> => {
      const start = new Date(year, month, 1);
      const end = endOfMonth(start);

      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('checked_in_at')
        .gte('checked_in_at', start.toISOString())
        .lte('checked_in_at', end.toISOString());

      const days = eachDayOfInterval({ start, end });
      const heatmap: MonthlyHeatmapCell[] = days.map(day => ({
        date: format(day, 'yyyy-MM-dd'),
        count: 0,
        dayOfMonth: day.getDate(),
      }));

      checkIns?.forEach(checkIn => {
        const dateStr = format(parseISO(checkIn.checked_in_at), 'yyyy-MM-dd');
        const cell = heatmap.find(c => c.date === dateStr);
        if (cell) cell.count++;
      });

      return heatmap;
    },
  });
}

// Previsão de receita
export interface RevenueForecast {
  month: string;
  projected: number;
  confirmed: number;
  atRisk: number;
}

export function useRevenueForecast(monthsAhead: number = 3) {
  return useQuery({
    queryKey: ['revenue-forecast', monthsAhead],
    queryFn: async (): Promise<RevenueForecast[]> => {
      const now = new Date();
      
      // Get active subscriptions with their plans
      const { data: subscriptions } = await supabase
        .from('subscriptions')
        .select(`
          id,
          status,
          end_date,
          auto_renew,
          plan:plans(price)
        `)
        .eq('status', 'active');

      const forecasts: RevenueForecast[] = [];

      for (let i = 0; i < monthsAhead; i++) {
        const targetMonth = subMonths(now, -i - 1);
        const monthStr = format(targetMonth, 'MMM yyyy', { locale: ptBR });
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        let projected = 0;
        let confirmed = 0;
        let atRisk = 0;

        subscriptions?.forEach(sub => {
          const endDate = sub.end_date ? new Date(sub.end_date) : null;
          const planPrice = (sub.plan as any)?.price || 0;

          // Check if subscription will be active during this month
          if (!endDate || endDate >= monthStart) {
            if (sub.auto_renew) {
              confirmed += planPrice;
            } else if (endDate && endDate <= monthEnd) {
              atRisk += planPrice;
            } else {
              projected += planPrice;
            }
          }
        });

        forecasts.push({
          month: monthStr,
          projected,
          confirmed,
          atRisk,
        });
      }

      return forecasts;
    },
  });
}
