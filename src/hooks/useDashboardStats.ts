import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subMonths, format, parseISO, differenceInDays, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface DashboardStats {
  // Revenue
  currentMonthRevenue: number;
  lastMonthRevenue: number;
  revenueGrowth: number;
  totalExpected: number;
  
  // Delinquency
  overdueAmount: number;
  overdueCount: number;
  delinquencyRate: number;
  
  // Leads & Conversion
  totalLeads: number;
  newLeadsThisMonth: number;
  activeClients: number;
  conversionRate: number;
  leadsGrowth: number;
  
  // Churn
  churnedThisMonth: number;
  churnRate: number;
  
  // Attendance
  totalCheckInsThisMonth: number;
  avgCheckInsPerClient: number;
  inactiveClients: number;
  inactivityRate: number;
}

export interface MonthlyChartData {
  month: string;
  leads: number;
  conversions: number;
  revenue: number;
  checkIns: number;
}

export type ChartPeriodFilter = '4weeks' | '3months' | '6months';

export interface ChartDataPoint {
  [key: string]: string | number;
  name: string;
  leads: number;
  conversions: number;
  revenue: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const currentMonthEnd = endOfMonth(now);
      const lastMonthStart = startOfMonth(subMonths(now, 1));
      const lastMonthEnd = endOfMonth(subMonths(now, 1));
      
      // Fetch all data in parallel
      const [
        leadsResult,
        subscriptionsResult,
        invoicesCurrentResult,
        invoicesLastResult,
        overdueResult,
        checkInsCurrentResult,
        checkInsLastResult,
      ] = await Promise.all([
        // All leads
        supabase.from('leads').select('id, status, created_at'),
        
        // All subscriptions
        supabase.from('subscriptions').select('id, status, lead_id, created_at, end_date'),
        
        // Paid invoices this month
        supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', currentMonthStart.toISOString())
          .lte('paid_at', currentMonthEnd.toISOString()),
        
        // Paid invoices last month
        supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', lastMonthStart.toISOString())
          .lte('paid_at', lastMonthEnd.toISOString()),
        
        // Overdue invoices
        supabase.from('invoices').select('amount').eq('status', 'overdue'),
        
        // Check-ins this month
        supabase
          .from('check_ins')
          .select('id, lead_id')
          .gte('checked_in_at', currentMonthStart.toISOString())
          .lte('checked_in_at', currentMonthEnd.toISOString()),
        
        // Check-ins last month
        supabase
          .from('check_ins')
          .select('id')
          .gte('checked_in_at', lastMonthStart.toISOString())
          .lte('checked_in_at', lastMonthEnd.toISOString()),
      ]);
      
      const leads = leadsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];
      const invoicesCurrent = invoicesCurrentResult.data || [];
      const invoicesLast = invoicesLastResult.data || [];
      const overdueInvoices = overdueResult.data || [];
      const checkInsCurrent = checkInsCurrentResult.data || [];
      
      // Calculate revenue
      const currentMonthRevenue = invoicesCurrent.reduce((sum, i) => sum + Number(i.amount), 0);
      const lastMonthRevenue = invoicesLast.reduce((sum, i) => sum + Number(i.amount), 0);
      const revenueGrowth = lastMonthRevenue > 0 
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
        : 0;
      
      // Calculate expected revenue from active subscriptions
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active');
      
      // Calculate delinquency
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
      const overdueCount = overdueInvoices.length;
      const delinquencyRate = activeSubscriptions.length > 0 
        ? (overdueCount / activeSubscriptions.length) * 100 
        : 0;
      
      // Calculate leads & conversion
      const totalLeads = leads.length;
      const newLeadsThisMonth = leads.filter(l => {
        const createdAt = parseISO(l.created_at);
        return createdAt >= currentMonthStart && createdAt <= currentMonthEnd;
      }).length;
      const activeClients = leads.filter(l => l.status === 'ativo').length;
      const conversionRate = totalLeads > 0 ? (activeClients / totalLeads) * 100 : 0;
      
      // Leads growth
      const leadsLastMonth = leads.filter(l => {
        const createdAt = parseISO(l.created_at);
        return createdAt >= lastMonthStart && createdAt <= lastMonthEnd;
      }).length;
      const leadsGrowth = leadsLastMonth > 0 
        ? ((newLeadsThisMonth - leadsLastMonth) / leadsLastMonth) * 100 
        : newLeadsThisMonth > 0 ? 100 : 0;
      
      // Calculate churn
      const churnedThisMonth = subscriptions.filter(s => {
        if (s.status !== 'cancelled' && s.status !== 'expired') return false;
        const endDate = parseISO(s.end_date);
        return endDate >= currentMonthStart && endDate <= currentMonthEnd;
      }).length;
      
      const activeLastMonth = activeSubscriptions.length + churnedThisMonth;
      const churnRate = activeLastMonth > 0 ? (churnedThisMonth / activeLastMonth) * 100 : 0;
      
      // Calculate attendance
      const totalCheckInsThisMonth = checkInsCurrent.length;
      const avgCheckInsPerClient = activeClients > 0 
        ? totalCheckInsThisMonth / activeClients 
        : 0;
      
      // Inactive clients (active subscription but no check-in in 7+ days)
      const uniqueCheckInLeads = new Set(checkInsCurrent.map(c => c.lead_id));
      const inactiveClients = activeClients - uniqueCheckInLeads.size;
      const inactivityRate = activeClients > 0 ? (inactiveClients / activeClients) * 100 : 0;
      
      return {
        currentMonthRevenue,
        lastMonthRevenue,
        revenueGrowth,
        totalExpected: currentMonthRevenue, // simplified
        overdueAmount,
        overdueCount,
        delinquencyRate,
        totalLeads,
        newLeadsThisMonth,
        activeClients,
        conversionRate,
        leadsGrowth,
        churnedThisMonth,
        churnRate,
        totalCheckInsThisMonth,
        avgCheckInsPerClient,
        inactiveClients,
        inactivityRate,
      };
    },
  });
}

export function useMonthlyChartData() {
  return useQuery({
    queryKey: ['monthly-chart-data'],
    queryFn: async (): Promise<MonthlyChartData[]> => {
      const now = new Date();
      const months: MonthlyChartData[] = [];
      
      // Get data for last 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        const monthLabel = format(monthDate, 'MMM');
        
        const [leadsResult, conversionsResult, revenueResult, checkInsResult] = await Promise.all([
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .gte('created_at', monthStart.toISOString())
            .lte('created_at', monthEnd.toISOString()),
          
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'ativo')
            .gte('updated_at', monthStart.toISOString())
            .lte('updated_at', monthEnd.toISOString()),
          
          supabase
            .from('invoices')
            .select('amount')
            .eq('status', 'paid')
            .gte('paid_at', monthStart.toISOString())
            .lte('paid_at', monthEnd.toISOString()),
          
          supabase
            .from('check_ins')
            .select('id', { count: 'exact', head: true })
            .gte('checked_in_at', monthStart.toISOString())
            .lte('checked_in_at', monthEnd.toISOString()),
        ]);
        
        const revenue = revenueResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
        
        months.push({
          month: monthLabel,
          leads: leadsResult.count || 0,
          conversions: conversionsResult.count || 0,
          revenue,
          checkIns: checkInsResult.count || 0,
        });
      }
      
      return months;
    },
  });
}

export function useFilteredChartData(period: ChartPeriodFilter) {
  return useQuery({
    queryKey: ['filtered-chart-data', period],
    queryFn: async (): Promise<ChartDataPoint[]> => {
      const now = new Date();
      const data: ChartDataPoint[] = [];

      if (period === '4weeks') {
        // Fetch data for last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 0 });
          const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 0 });

          const [leadsResult, conversionsResult, revenueResult] = await Promise.all([
            supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', weekStart.toISOString())
              .lte('created_at', weekEnd.toISOString()),
            supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'ativo')
              .gte('updated_at', weekStart.toISOString())
              .lte('updated_at', weekEnd.toISOString()),
            supabase
              .from('invoices')
              .select('amount')
              .eq('status', 'paid')
              .gte('paid_at', weekStart.toISOString())
              .lte('paid_at', weekEnd.toISOString()),
          ]);

          const revenue = revenueResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

          data.push({
            name: `Sem ${4 - i}`,
            leads: leadsResult.count || 0,
            conversions: conversionsResult.count || 0,
            revenue,
          });
        }
      } else {
        // Fetch data for 3 or 6 months
        const monthsCount = period === '3months' ? 3 : 6;

        for (let i = monthsCount - 1; i >= 0; i--) {
          const monthStart = startOfMonth(subMonths(now, i));
          const monthEnd = endOfMonth(subMonths(now, i));

          const [leadsResult, conversionsResult, revenueResult] = await Promise.all([
            supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .gte('created_at', monthStart.toISOString())
              .lte('created_at', monthEnd.toISOString()),
            supabase
              .from('leads')
              .select('id', { count: 'exact', head: true })
              .eq('status', 'ativo')
              .gte('updated_at', monthStart.toISOString())
              .lte('updated_at', monthEnd.toISOString()),
            supabase
              .from('invoices')
              .select('amount')
              .eq('status', 'paid')
              .gte('paid_at', monthStart.toISOString())
              .lte('paid_at', monthEnd.toISOString()),
          ]);

          const revenue = revenueResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

          data.push({
            name: format(monthStart, 'MMM', { locale: ptBR }),
            leads: leadsResult.count || 0,
            conversions: conversionsResult.count || 0,
            revenue,
          });
        }
      }

      return data;
    },
  });
}

export function useTopSellers() {
  return useQuery({
    queryKey: ['top-sellers'],
    queryFn: async () => {
      // Get leads grouped by assigned_to with conversion stats
      const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, status')
        .not('assigned_to', 'is', null);
      
      if (error) throw error;
      
      // Get profiles for assigned users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, avatar_url');
      
      // Aggregate by user
      const userStats: Record<string, { leads: number; conversions: number }> = {};
      
      for (const lead of leads || []) {
        if (!lead.assigned_to) continue;
        if (!userStats[lead.assigned_to]) {
          userStats[lead.assigned_to] = { leads: 0, conversions: 0 };
        }
        userStats[lead.assigned_to].leads++;
        if (lead.status === 'ativo') {
          userStats[lead.assigned_to].conversions++;
        }
      }
      
      // Map to profiles and sort by conversions
      const sellers = Object.entries(userStats)
        .map(([userId, stats]) => {
          const profile = profiles?.find(p => p.user_id === userId);
          return {
            userId,
            name: profile?.full_name || 'Usuário',
            avatarUrl: profile?.avatar_url,
            leads: stats.leads,
            conversions: stats.conversions,
            conversionRate: stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0,
          };
        })
        .sort((a, b) => b.conversions - a.conversions)
        .slice(0, 5);
      
      return sellers;
    },
  });
}
