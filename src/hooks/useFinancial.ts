import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logActivity } from '@/hooks/useActivityLogs';

export interface Plan {
  id: string;
  unit_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
  features: string[] | null;
  created_at: string;
}

export interface Subscription {
  id: string;
  unit_id: string;
  lead_id: string;
  plan_id: string;
  status: 'active' | 'pending' | 'cancelled' | 'expired' | 'suspended';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  payment_day: number;
  created_at: string;
  lead?: { id: string; full_name: string; email: string | null; phone: string };
  plan?: Plan;
}

export interface Invoice {
  id: string;
  unit_id: string;
  subscription_id: string;
  lead_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded';
  description: string | null;
  reference_month: string | null;
  pix_code: string | null;
  boleto_url: string | null;
  created_at: string;
  lead?: { id: string; full_name: string; email: string | null; phone: string };
  subscription?: { plan?: Plan };
}

export interface Payment {
  id: string;
  unit_id: string;
  invoice_id: string;
  amount: number;
  payment_method: 'pix' | 'boleto' | 'credit_card' | 'debit_card' | 'cash';
  paid_at: string;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
}

// Plans
export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      return data as Plan[];
    },
  });
}

export function useCreatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<Plan, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('plans')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      logActivity({
        entity_type: 'plan',
        entity_id: data.id,
        action: 'create',
        description: `Plano "${data.name}" criado`,
        metadata: { plan_name: data.name, price: data.price },
      });
      toast({ title: 'Plano criado', description: 'O plano foi criado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar plano', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdatePlan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Plan> & { id: string }) => {
      const { data, error } = await supabase
        .from('plans')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      toast({ title: 'Plano atualizado' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar plano', description: error.message, variant: 'destructive' });
    },
  });
}

// Subscriptions
export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, lead:leads(id, full_name, email, phone), plan:plans(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Subscription[];
    },
  });
}

export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<Subscription, 'id' | 'created_at' | 'lead' | 'plan'>) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      logActivity({
        entity_type: 'subscription',
        entity_id: data.id,
        action: 'create',
        description: 'Nova assinatura criada',
        metadata: { lead_id: data.lead_id, plan_id: data.plan_id },
      });
      toast({ title: 'Assinatura criada', description: 'A assinatura foi criada com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar assinatura', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Subscription> & { id: string }) => {
      const { data, error } = await supabase
        .from('subscriptions')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });
}

// Invoices
export function useInvoices(status?: string) {
  return useQuery({
    queryKey: ['invoices', status],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, lead:leads(id, full_name, email, phone), subscription:subscriptions(plan:plans(*))')
        .order('due_date', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status as 'pending' | 'paid' | 'overdue' | 'cancelled' | 'refunded');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Invoice[];
    },
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<Invoice, 'id' | 'created_at' | 'lead' | 'subscription'>) => {
      const { data, error } = await supabase
        .from('invoices')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity({
        entity_type: 'invoice',
        entity_id: data.id,
        action: 'create',
        description: `Fatura de R$ ${Number(data.amount).toFixed(2)} criada`,
        metadata: { amount: data.amount, due_date: data.due_date },
      });
      toast({ title: 'Fatura criada', description: 'A fatura foi criada com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar fatura', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Invoice> & { id: string }) => {
      const { data, error } = await supabase
        .from('invoices')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });
}

// Payments
export function usePayments(invoiceId?: string) {
  return useQuery({
    queryKey: ['payments', invoiceId],
    queryFn: async () => {
      let query = supabase
        .from('payments')
        .select('*')
        .order('paid_at', { ascending: false });

      if (invoiceId) {
        query = query.eq('invoice_id', invoiceId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Payment[];
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: Omit<Payment, 'id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('payments')
        .insert({ ...input, created_by: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      logActivity({
        entity_type: 'payment',
        entity_id: data.id,
        action: 'create',
        description: `Pagamento de R$ ${Number(data.amount).toFixed(2)} registrado`,
        metadata: { amount: data.amount, payment_method: data.payment_method },
      });
      toast({ title: 'Pagamento registrado', description: 'O pagamento foi registrado com sucesso.' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao registrar pagamento', description: error.message, variant: 'destructive' });
    },
  });
}

// Financial Stats
export function useFinancialStats() {
  return useQuery({
    queryKey: ['financial-stats'],
    queryFn: async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const [invoicesResult, paidResult, overdueResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('amount, status')
          .gte('due_date', startOfMonth.toISOString()),
        supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'paid')
          .gte('paid_at', startOfMonth.toISOString()),
        supabase
          .from('invoices')
          .select('amount')
          .eq('status', 'overdue'),
      ]);

      const totalExpected = invoicesResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const totalReceived = paidResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const totalOverdue = overdueResult.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const pendingCount = invoicesResult.data?.filter(i => i.status === 'pending').length || 0;

      return {
        totalExpected,
        totalReceived,
        totalOverdue,
        pendingCount,
        overdueCount: overdueResult.data?.length || 0,
      };
    },
  });
}

// Overdue and Pending Invoices for Dashboard
export function useOverdueInvoices() {
  return useQuery({
    queryKey: ['invoices-overdue'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, lead:leads(id, full_name, email, phone)')
        .in('status', ['overdue', 'pending'])
        .order('due_date', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data as Invoice[];
    },
  });
}
