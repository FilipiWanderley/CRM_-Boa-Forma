import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Wallet, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  CalendarDays,
  TrendingUp
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinanceiroSectionProps {
  leadId?: string;
}

// Hook para buscar assinatura do aluno
function useMySubscription(leadId?: string) {
  return useQuery({
    queryKey: ['my-subscription', leadId],
    queryFn: async () => {
      if (!leadId) return null;
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, plan:plans(*)')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!leadId,
  });
}

// Hook para buscar faturas do aluno
function useMyInvoices(leadId?: string) {
  return useQuery({
    queryKey: ['my-invoices', leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('lead_id', leadId)
        .order('due_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });
}

export function FinanceiroSection({ leadId }: FinanceiroSectionProps) {
  const { data: subscription, isLoading: subLoading } = useMySubscription(leadId);
  const { data: invoices, isLoading: invLoading } = useMyInvoices(leadId);

  const isLoading = subLoading || invLoading;

  // Calcular dias restantes da assinatura
  const getDaysRemaining = () => {
    if (!subscription?.end_date) return null;
    const endDate = parseISO(subscription.end_date);
    const days = differenceInDays(endDate, new Date());
    return days;
  };

  const daysRemaining = getDaysRemaining();

  // Formatação de moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Status badge da assinatura
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success/20 text-success border-0">Ativo</Badge>;
      case 'pending':
        return <Badge className="bg-amber/20 text-amber border-0">Pendente</Badge>;
      case 'expired':
        return <Badge className="bg-destructive/20 text-destructive border-0">Expirado</Badge>;
      case 'cancelled':
        return <Badge className="bg-muted text-muted-foreground border-0">Cancelado</Badge>;
      case 'suspended':
        return <Badge className="bg-destructive/20 text-destructive border-0">Suspenso</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Status badge da fatura
  const getInvoiceStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <Badge className="bg-success/20 text-success border-0 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Pago
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-amber/20 text-amber border-0 gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
      case 'overdue':
        return (
          <Badge className="bg-destructive/20 text-destructive border-0 gap-1">
            <AlertCircle className="h-3 w-3" />
            Vencida
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-muted text-muted-foreground border-0">
            Cancelada
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </div>
    );
  }

  // Separar faturas pendentes/vencidas das pagas
  const pendingInvoices = invoices?.filter(i => i.status === 'pending' || i.status === 'overdue') || [];
  const paidInvoices = invoices?.filter(i => i.status === 'paid') || [];

  return (
    <div className="space-y-4">
      {/* Card do Plano Atual */}
      {subscription ? (
        <Card className="card-neon overflow-hidden">
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/20">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-primary/80 font-medium">Seu Plano</p>
                  <h3 className="text-lg font-bold text-foreground">
                    {subscription.plan?.name || 'Plano Ativo'}
                  </h3>
                </div>
              </div>
              {getStatusBadge(subscription.status)}
            </div>

            {/* Valor e Vencimento */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Valor</p>
                <p className="text-lg font-bold text-foreground">
                  {subscription.plan?.price ? formatCurrency(subscription.plan.price) : '--'}
                </p>
                <p className="text-xs text-muted-foreground">
                  /{subscription.plan?.duration_days === 30 ? 'mês' : `${subscription.plan?.duration_days} dias`}
                </p>
              </div>
              
              <div className="bg-background/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Vencimento</p>
                <p className="text-lg font-bold text-foreground">
                  {daysRemaining !== null ? (
                    daysRemaining > 0 ? `${daysRemaining} dias` : 'Vencido'
                  ) : '--'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {subscription.end_date 
                    ? format(parseISO(subscription.end_date), "dd 'de' MMM", { locale: ptBR })
                    : '--'
                  }
                </p>
              </div>
            </div>

            {/* Dia de pagamento */}
            {subscription.payment_day && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />
                Dia de pagamento: {subscription.payment_day}
              </div>
            )}
          </div>
        </Card>
      ) : (
        <Card className="card-fitness">
          <CardContent className="py-8 text-center">
            <Wallet className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="font-semibold text-foreground mb-1">Sem assinatura ativa</h3>
            <p className="text-sm text-muted-foreground">
              Entre em contato com a recepção para contratar um plano.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Faturas Pendentes */}
      {pendingInvoices.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-display font-bold text-foreground flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber" />
            Faturas Pendentes
          </h3>
          {pendingInvoices.map((invoice) => (
            <Card 
              key={invoice.id} 
              className={`card-fitness border-l-4 ${
                invoice.status === 'overdue' ? 'border-l-destructive' : 'border-l-amber'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${
                      invoice.status === 'overdue' ? 'bg-destructive/10' : 'bg-amber/10'
                    }`}>
                      <Receipt className={`h-5 w-5 ${
                        invoice.status === 'overdue' ? 'text-destructive' : 'text-amber'
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {formatCurrency(invoice.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Venc. {format(parseISO(invoice.due_date), "dd/MM/yyyy")}
                      </p>
                    </div>
                  </div>
                  {getInvoiceStatusBadge(invoice.status)}
                </div>
                {invoice.description && (
                  <p className="text-sm text-muted-foreground mt-2">{invoice.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Histórico de Pagamentos */}
      <div className="space-y-2">
        <h3 className="font-display font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-success" />
          Histórico de Pagamentos
        </h3>
        
        {paidInvoices.length > 0 ? (
          <div className="space-y-2">
            {paidInvoices.slice(0, 5).map((invoice) => (
              <Card key={invoice.id} className="card-fitness">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-success/10">
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {formatCurrency(invoice.amount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.paid_at 
                            ? `Pago em ${format(parseISO(invoice.paid_at), "dd/MM/yyyy")}`
                            : invoice.reference_month || '--'
                          }
                        </p>
                      </div>
                    </div>
                    {getInvoiceStatusBadge(invoice.status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="card-fitness">
            <CardContent className="py-6 text-center">
              <Receipt className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Nenhum pagamento registrado ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}