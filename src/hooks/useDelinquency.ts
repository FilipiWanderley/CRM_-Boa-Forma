import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DelinquencyStatus {
  isDelinquent: boolean;
  overdueAmount: number;
  overdueInvoices: number;
  oldestOverdueDate: string | null;
  daysPastDue: number;
}

export function useLeadDelinquencyStatus(leadId: string | undefined) {
  return useQuery({
    queryKey: ['delinquency', leadId],
    queryFn: async (): Promise<DelinquencyStatus> => {
      if (!leadId) {
        return {
          isDelinquent: false,
          overdueAmount: 0,
          overdueInvoices: 0,
          oldestOverdueDate: null,
          daysPastDue: 0,
        };
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'overdue');

      if (error) throw error;

      if (!invoices || invoices.length === 0) {
        return {
          isDelinquent: false,
          overdueAmount: 0,
          overdueInvoices: 0,
          oldestOverdueDate: null,
          daysPastDue: 0,
        };
      }

      const totalOverdue = invoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
      const oldestDueDate = invoices
        .map((inv) => inv.due_date)
        .sort()[0];

      const daysPastDue = oldestDueDate
        ? Math.floor((Date.now() - new Date(oldestDueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        isDelinquent: true,
        overdueAmount: totalOverdue,
        overdueInvoices: invoices.length,
        oldestOverdueDate: oldestDueDate,
        daysPastDue,
      };
    },
    enabled: !!leadId,
  });
}

export function useCheckAccessAllowed(leadId: string | undefined) {
  const { data: delinquency, isLoading } = useLeadDelinquencyStatus(leadId);

  // Block access if more than 5 days overdue
  const isBlocked = delinquency?.isDelinquent && delinquency.daysPastDue > 5;

  return {
    isLoading,
    isBlocked,
    delinquency,
    blockReason: isBlocked
      ? `Acesso bloqueado: ${delinquency?.overdueInvoices} fatura(s) em atraso há ${delinquency?.daysPastDue} dias (R$ ${delinquency?.overdueAmount.toFixed(2)})`
      : null,
  };
}
