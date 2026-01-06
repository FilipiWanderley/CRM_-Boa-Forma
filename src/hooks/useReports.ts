import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, subDays, subMonths, parseISO, isWithinInterval, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type ReportPeriod = '7d' | '30d' | '90d' | 'month' | '3months' | '6months' | 'year';

export interface ReportFilters {
  period: ReportPeriod;
  sellerId?: string;
  planId?: string;
}

export function getDateRangeFromPeriod(period: ReportPeriod) {
  const now = new Date();
  switch (period) {
    case '7d':
      return { start: subDays(now, 7), end: now };
    case '30d':
      return { start: subDays(now, 30), end: now };
    case '90d':
      return { start: subDays(now, 90), end: now };
    case 'month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case '3months':
      return { start: subMonths(now, 3), end: now };
    case '6months':
      return { start: subMonths(now, 6), end: now };
    case 'year':
      return { start: subMonths(now, 12), end: now };
    default:
      return { start: subDays(now, 30), end: now };
  }
}

export function useSellers() {
  return useQuery({
    queryKey: ['sellers-list'],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name')
        .order('full_name');

      if (error) throw error;

      // Get users with recepcao or gestor roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['gestor', 'recepcao', 'professor']);

      const sellerUserIds = new Set(roles?.map(r => r.user_id) || []);
      
      return profiles?.filter(p => sellerUserIds.has(p.user_id)) || [];
    },
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['plans-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('id, name, price')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export interface LeadsReportData {
  totalLeads: number;
  newLeads: number;
  activeClients: number;
  conversionRate: number;
  inNegotiation: number;
  scheduledVisits: number;
  cancelled: number;
  leadsByStatus: { name: string; value: number; status: string }[];
  leadsBySource: { name: string; value: number }[];
  leadsBySeller: { name: string; leads: number; conversions: number; rate: number }[];
  dailyTrend: { date: string; leads: number; conversions: number }[];
}

export function useLeadsReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['leads-report', filters],
    queryFn: async (): Promise<LeadsReportData> => {
      const dateRange = getDateRangeFromPeriod(filters.period);

      let query = supabase
        .from('leads')
        .select('id, status, source, assigned_to, created_at, updated_at');

      const { data: leads, error } = await query;
      if (error) throw error;

      // Filter by date
      let filteredLeads = (leads || []).filter(lead => {
        const createdAt = parseISO(lead.created_at);
        return isWithinInterval(createdAt, dateRange);
      });

      // Filter by seller
      if (filters.sellerId) {
        filteredLeads = filteredLeads.filter(l => l.assigned_to === filters.sellerId);
      }

      // Get profiles for seller names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name');

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Calculate stats
      const totalLeads = filteredLeads.length;
      const newLeads = filteredLeads.filter(l => l.status === 'lead').length;
      const activeClients = filteredLeads.filter(l => l.status === 'ativo').length;
      const inNegotiation = filteredLeads.filter(l => l.status === 'negociacao').length;
      const scheduledVisits = filteredLeads.filter(l => l.status === 'visita_agendada').length;
      const cancelled = filteredLeads.filter(l => l.status === 'cancelado').length;
      const conversionRate = totalLeads > 0 ? (activeClients / totalLeads) * 100 : 0;

      // Status distribution
      const statusCounts = filteredLeads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusLabels: Record<string, string> = {
        lead: 'Novo Lead',
        visita_agendada: 'Visita Agendada',
        negociacao: 'Em Negociação',
        ativo: 'Ativo',
        inativo: 'Inativo',
        cancelado: 'Cancelado',
      };

      const leadsByStatus = Object.entries(statusCounts).map(([status, count]) => ({
        name: statusLabels[status] || status,
        value: count,
        status,
      }));

      // Source distribution
      const sourceCounts = filteredLeads.reduce((acc, lead) => {
        const source = lead.source || 'Não informado';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const leadsBySource = Object.entries(sourceCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Seller performance
      const sellerStats: Record<string, { leads: number; conversions: number }> = {};
      filteredLeads.forEach(lead => {
        if (lead.assigned_to) {
          if (!sellerStats[lead.assigned_to]) {
            sellerStats[lead.assigned_to] = { leads: 0, conversions: 0 };
          }
          sellerStats[lead.assigned_to].leads++;
          if (lead.status === 'ativo') {
            sellerStats[lead.assigned_to].conversions++;
          }
        }
      });

      const leadsBySeller = Object.entries(sellerStats)
        .map(([userId, stats]) => ({
          name: profileMap.get(userId) || 'Desconhecido',
          leads: stats.leads,
          conversions: stats.conversions,
          rate: stats.leads > 0 ? (stats.conversions / stats.leads) * 100 : 0,
        }))
        .sort((a, b) => b.conversions - a.conversions);

      // Daily trend - group by week if period > 30 days
      const dailyTrend: { date: string; leads: number; conversions: number }[] = [];
      const shouldGroupByMonth = ['3months', '6months', 'year'].includes(filters.period);
      
      if (shouldGroupByMonth) {
        const monthlyData: Record<string, { leads: number; conversions: number }> = {};
        filteredLeads.forEach(lead => {
          const month = format(parseISO(lead.created_at), 'MMM/yy', { locale: ptBR });
          if (!monthlyData[month]) {
            monthlyData[month] = { leads: 0, conversions: 0 };
          }
          monthlyData[month].leads++;
          if (lead.status === 'ativo') {
            monthlyData[month].conversions++;
          }
        });
        Object.entries(monthlyData).forEach(([date, data]) => {
          dailyTrend.push({ date, ...data });
        });
      } else {
        const dailyData: Record<string, { leads: number; conversions: number }> = {};
        filteredLeads.forEach(lead => {
          const date = format(parseISO(lead.created_at), 'dd/MM', { locale: ptBR });
          if (!dailyData[date]) {
            dailyData[date] = { leads: 0, conversions: 0 };
          }
          dailyData[date].leads++;
          if (lead.status === 'ativo') {
            dailyData[date].conversions++;
          }
        });
        Object.entries(dailyData).forEach(([date, data]) => {
          dailyTrend.push({ date, ...data });
        });
      }

      return {
        totalLeads,
        newLeads,
        activeClients,
        conversionRate,
        inNegotiation,
        scheduledVisits,
        cancelled,
        leadsByStatus,
        leadsBySource,
        leadsBySeller,
        dailyTrend,
      };
    },
  });
}

export interface FinancialReportData {
  totalRevenue: number;
  expectedRevenue: number;
  overdueAmount: number;
  overdueCount: number;
  paidCount: number;
  pendingCount: number;
  revenueByPlan: { name: string; value: number }[];
  revenueByMonth: { month: string; paid: number; pending: number; overdue: number }[];
  subscriptionsByStatus: { name: string; value: number }[];
}

export function useFinancialReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['financial-report', filters],
    queryFn: async (): Promise<FinancialReportData> => {
      const dateRange = getDateRangeFromPeriod(filters.period);

      // Get invoices
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('id, amount, status, due_date, paid_at, subscription_id');

      if (invoicesError) throw invoicesError;

      // Get subscriptions with plans
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('id, status, plan_id, plans(id, name, price)');

      if (subsError) throw subsError;

      // Get plans
      const { data: plans } = await supabase
        .from('plans')
        .select('id, name');

      const planMap = new Map(plans?.map(p => [p.id, p.name]) || []);

      // Filter invoices by date
      const filteredInvoices = (invoices || []).filter(inv => {
        const dueDate = parseISO(inv.due_date);
        return isWithinInterval(dueDate, dateRange);
      });

      // Filter by plan if specified
      let finalInvoices = filteredInvoices;
      if (filters.planId) {
        const subsWithPlan = new Set(
          subscriptions?.filter(s => s.plan_id === filters.planId).map(s => s.id) || []
        );
        finalInvoices = filteredInvoices.filter(inv => subsWithPlan.has(inv.subscription_id));
      }

      // Calculate stats
      const totalRevenue = finalInvoices
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount), 0);

      const expectedRevenue = finalInvoices.reduce((sum, i) => sum + Number(i.amount), 0);

      const overdueInvoices = finalInvoices.filter(i => i.status === 'overdue');
      const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.amount), 0);
      const overdueCount = overdueInvoices.length;

      const paidCount = finalInvoices.filter(i => i.status === 'paid').length;
      const pendingCount = finalInvoices.filter(i => i.status === 'pending').length;

      // Revenue by plan
      const revenueByPlanMap: Record<string, number> = {};
      finalInvoices.filter(i => i.status === 'paid').forEach(inv => {
        const sub = subscriptions?.find(s => s.id === inv.subscription_id);
        const planName = sub?.plan_id ? planMap.get(sub.plan_id) || 'Desconhecido' : 'Desconhecido';
        revenueByPlanMap[planName] = (revenueByPlanMap[planName] || 0) + Number(inv.amount);
      });

      const revenueByPlan = Object.entries(revenueByPlanMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Revenue by month
      const monthlyData: Record<string, { paid: number; pending: number; overdue: number }> = {};
      finalInvoices.forEach(inv => {
        const month = format(parseISO(inv.due_date), 'MMM/yy', { locale: ptBR });
        if (!monthlyData[month]) {
          monthlyData[month] = { paid: 0, pending: 0, overdue: 0 };
        }
        const amount = Number(inv.amount);
        if (inv.status === 'paid') monthlyData[month].paid += amount;
        else if (inv.status === 'pending') monthlyData[month].pending += amount;
        else if (inv.status === 'overdue') monthlyData[month].overdue += amount;
      });

      const revenueByMonth = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
      }));

      // Subscriptions by status
      const subsStatusCounts = (subscriptions || []).reduce((acc, sub) => {
        acc[sub.status] = (acc[sub.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusLabels: Record<string, string> = {
        active: 'Ativa',
        pending: 'Pendente',
        cancelled: 'Cancelada',
        expired: 'Expirada',
        suspended: 'Suspensa',
      };

      const subscriptionsByStatus = Object.entries(subsStatusCounts).map(([status, value]) => ({
        name: statusLabels[status] || status,
        value,
      }));

      return {
        totalRevenue,
        expectedRevenue,
        overdueAmount,
        overdueCount,
        paidCount,
        pendingCount,
        revenueByPlan,
        revenueByMonth,
        subscriptionsByStatus,
      };
    },
  });
}
