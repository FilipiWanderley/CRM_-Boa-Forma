import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { 
  usePlans, 
  useInvoices, 
  useSubscriptions, 
  useFinancialStats,
  type Plan,
  type Invoice 
} from '@/hooks/useFinancial';
import { PlanCard } from '@/components/financial/PlanCard';
import { InvoiceTable } from '@/components/financial/InvoiceTable';
import { CreatePlanDialog } from '@/components/financial/CreatePlanDialog';
import { CreateSubscriptionDialog } from '@/components/financial/CreateSubscriptionDialog';
import { RegisterPaymentDialog } from '@/components/financial/RegisterPaymentDialog';
import { 
  Wallet, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  Package,
  Users,
  Receipt,
  CreditCard
} from 'lucide-react';

export default function Financial() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [invoiceFilter, setInvoiceFilter] = useState('all');
  const [createPlanOpen, setCreatePlanOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [createSubscriptionOpen, setCreateSubscriptionOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: invoices, isLoading: invoicesLoading } = useInvoices(invoiceFilter);
  const { data: subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { data: stats, isLoading: statsLoading } = useFinancialStats();

  const unitId = profile?.unit_id;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setCreatePlanOpen(true);
  };

  const handleRegisterPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleViewInvoiceDetails = (invoice: Invoice) => {
    // TODO: Implement invoice details view
    console.log('View invoice:', invoice);
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Financeiro
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie mensalidades, cobranças e pagamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreateSubscriptionOpen(true)}>
              <Users className="h-4 w-4 mr-2" />
              Nova Assinatura
            </Button>
            <Button onClick={() => { setEditingPlan(null); setCreatePlanOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita do Mês
              </CardTitle>
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{formatCurrency(stats?.totalReceived || 0)}</div>
                  <p className="text-xs text-muted-foreground">
                    de {formatCurrency(stats?.totalExpected || 0)} previsto
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Faturas Pendentes
              </CardTitle>
              <div className="p-2 rounded-lg bg-warning/10">
                <Receipt className="h-4 w-4 text-warning" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
                  <p className="text-xs text-muted-foreground">aguardando pagamento</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Em Atraso
              </CardTitle>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-destructive">
                    {formatCurrency(stats?.totalOverdue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats?.overdueCount || 0} faturas vencidas
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="card-glow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Assinaturas Ativas
              </CardTitle>
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {subscriptionsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {subscriptions?.filter(s => s.status === 'active').length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">alunos matriculados</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="invoices" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Faturas
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Planos
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Assinaturas
            </TabsTrigger>
          </TabsList>

          {/* Tab: Overview */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Invoices */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    Faturas Recentes
                  </CardTitle>
                  <CardDescription>Últimas faturas geradas</CardDescription>
                </CardHeader>
                <CardContent>
                  {invoicesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : invoices && invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.slice(0, 5).map((invoice) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div>
                            <p className="font-medium text-sm">{invoice.lead?.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              Venc: {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{formatCurrency(Number(invoice.amount))}</span>
                            <Badge variant={
                              invoice.status === 'paid' ? 'default' :
                              invoice.status === 'overdue' ? 'destructive' : 'secondary'
                            }>
                              {invoice.status === 'paid' ? 'Pago' :
                               invoice.status === 'overdue' ? 'Vencido' : 'Pendente'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma fatura encontrada
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Active Plans */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    Planos Ativos
                  </CardTitle>
                  <CardDescription>Planos disponíveis para venda</CardDescription>
                </CardHeader>
                <CardContent>
                  {plansLoading ? (
                    <div className="space-y-2">
                      {[1, 2].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : plans && plans.filter(p => p.is_active).length > 0 ? (
                    <div className="space-y-3">
                      {plans.filter(p => p.is_active).map((plan) => (
                        <div key={plan.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                          <div>
                            <p className="font-medium">{plan.name}</p>
                            <p className="text-xs text-muted-foreground">{plan.duration_days} dias</p>
                          </div>
                          <span className="font-bold text-primary">{formatCurrency(Number(plan.price))}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">Nenhum plano cadastrado</p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => { setEditingPlan(null); setCreatePlanOpen(true); }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Primeiro Plano
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Invoices */}
          <TabsContent value="invoices" className="space-y-4">
            <div className="flex items-center justify-between">
              <Select value={invoiceFilter} onValueChange={setInvoiceFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="paid">Pagas</SelectItem>
                  <SelectItem value="overdue">Vencidas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {invoicesLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <InvoiceTable 
                invoices={invoices || []}
                onRegisterPayment={handleRegisterPayment}
                onViewDetails={handleViewInvoiceDetails}
              />
            )}
          </TabsContent>

          {/* Tab: Plans */}
          <TabsContent value="plans" className="space-y-4">
            {plansLoading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : plans && plans.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} onEdit={handleEditPlan} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhum plano cadastrado</h3>
                  <p className="text-muted-foreground mb-4">
                    Crie planos de mensalidade para seus alunos
                  </p>
                  <Button onClick={() => { setEditingPlan(null); setCreatePlanOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Plano
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Subscriptions */}
          <TabsContent value="subscriptions" className="space-y-4">
            {subscriptionsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : subscriptions && subscriptions.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-4 font-medium">Aluno</th>
                      <th className="text-left p-4 font-medium">Plano</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Vigência</th>
                      <th className="text-left p-4 font-medium">Vencimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub) => (
                      <tr key={sub.id} className="border-b">
                        <td className="p-4">
                          <p className="font-medium">{sub.lead?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{sub.lead?.phone}</p>
                        </td>
                        <td className="p-4">{sub.plan?.name}</td>
                        <td className="p-4">
                          <Badge variant={
                            sub.status === 'active' ? 'default' :
                            sub.status === 'expired' ? 'destructive' :
                            sub.status === 'cancelled' ? 'outline' : 'secondary'
                          }>
                            {sub.status === 'active' ? 'Ativo' :
                             sub.status === 'expired' ? 'Expirado' :
                             sub.status === 'cancelled' ? 'Cancelado' :
                             sub.status === 'suspended' ? 'Suspenso' : 'Pendente'}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">
                          {new Date(sub.start_date).toLocaleDateString('pt-BR')} - {new Date(sub.end_date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4 text-sm">
                          Dia {sub.payment_day}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">Nenhuma assinatura encontrada</h3>
                  <p className="text-muted-foreground mb-4">
                    Vincule alunos aos planos de mensalidade
                  </p>
                  <Button onClick={() => setCreateSubscriptionOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Assinatura
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        {unitId && (
          <>
            <CreatePlanDialog
              open={createPlanOpen}
              onOpenChange={(open) => {
                setCreatePlanOpen(open);
                if (!open) setEditingPlan(null);
              }}
              unitId={unitId}
              editingPlan={editingPlan}
            />
            <CreateSubscriptionDialog
              open={createSubscriptionOpen}
              onOpenChange={setCreateSubscriptionOpen}
              unitId={unitId}
            />
          </>
        )}
        <RegisterPaymentDialog
          open={paymentDialogOpen}
          onOpenChange={setPaymentDialogOpen}
          invoice={selectedInvoice}
        />
      </div>
    </AppLayout>
  );
}
