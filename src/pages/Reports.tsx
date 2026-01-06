import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Calendar, 
  ArrowUpRight, 
  Download,
  DollarSign,
  AlertTriangle,
  UserCheck,
  Filter,
  FileSpreadsheet,
  CalendarDays,
  Clock,
  UserX,
  Percent,
} from 'lucide-react';
import { 
  useLeadsReport, 
  useFinancialReport, 
  useSellers, 
  usePlans,
  type ReportPeriod,
  type ReportFilters,
} from '@/hooks/useReports';
import { useClassReport, type ClassReportFilters, type ClassReportPeriod } from '@/hooks/useClassReports';
import { useClassTypes } from '@/hooks/useClasses';
import { useUsers } from '@/hooks/useUsers';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  lead: '#3b82f6',
  visita_agendada: '#f59e0b',
  negociacao: '#8b5cf6',
  ativo: '#22c55e',
  inativo: '#6b7280',
  cancelado: '#ef4444',
};

const periodOptions = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: '6months', label: 'Últimos 6 meses' },
  { value: 'year', label: 'Último ano' },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-sm mb-1">{label || payload[0].payload.name}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {typeof entry.value === 'number' && entry.name?.includes('R$') 
              ? `R$ ${entry.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
              : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  loading, 
  variant = 'default' 
}: { 
  title: string; 
  value: string; 
  subtitle?: string;
  icon: React.ReactNode; 
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const variantStyles = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-500',
    warning: 'bg-amber-500/10 text-amber-500',
    danger: 'bg-red-500/10 text-red-500',
  };

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={`p-2.5 rounded-xl ${variantStyles[variant]}`}>
            {icon}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 uppercase tracking-wide">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-1" />
        ) : (
          <>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('leads');
  const [filters, setFilters] = useState<ReportFilters>({
    period: '30d',
    sellerId: undefined,
    planId: undefined,
  });
  const [classFilters, setClassFilters] = useState<ClassReportFilters>({
    period: '30d',
    classTypeId: undefined,
    professorId: undefined,
  });

  const { data: sellers } = useSellers();
  const { data: plans } = usePlans();
  const { data: leadsReport, isLoading: leadsLoading } = useLeadsReport(filters);
  const { data: financialReport, isLoading: financialLoading } = useFinancialReport(filters);
  const { data: classReport, isLoading: classLoading } = useClassReport(classFilters);
  const { data: classTypes } = useClassTypes();
  const { users } = useUsers();
  const professors = users?.filter(u => u.roles?.some(r => r.role === 'professor')) || [];

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportLeads = () => {
    if (!leadsReport?.leadsBySeller.length) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const data = leadsReport.leadsBySeller.map(s => ({
      vendedor: s.name,
      leads: s.leads,
      conversoes: s.conversions,
      taxa_conversao: `${s.rate.toFixed(1)}%`,
    }));
    exportToCSV(data, `relatorio-vendedores-${filters.period}`, {
      vendedor: 'Vendedor',
      leads: 'Leads',
      conversoes: 'Conversões',
      taxa_conversao: 'Taxa de Conversão',
    });
    toast({ title: 'Relatório exportado com sucesso!' });
  };

  const handleExportFinancial = () => {
    if (!financialReport?.revenueByPlan.length) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const data = financialReport.revenueByPlan.map(p => ({
      plano: p.name,
      receita: p.value,
    }));
    exportToCSV(data, `relatorio-financeiro-${filters.period}`, {
      plano: 'Plano',
      receita: 'Receita (R$)',
    });
    toast({ title: 'Relatório exportado com sucesso!' });
  };

  const handleExportTrend = () => {
    if (!leadsReport?.dailyTrend.length) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    exportToCSV(leadsReport.dailyTrend as Record<string, string | number>[], `tendencia-leads-${filters.period}`, {
      date: 'Data',
      leads: 'Leads',
      conversions: 'Conversões',
    });
    toast({ title: 'Dados exportados com sucesso!' });
  };

  const handleExportClassReport = () => {
    if (!classReport?.byClassType.length) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const data = classReport.byClassType.map(ct => ({
      modalidade: ct.name,
      aulas: ct.sessions,
      inscricoes: ct.enrollments,
      presencas: ct.attendances,
      faltas: ct.noShows,
      taxa_ocupacao: `${ct.occupancyRate.toFixed(1)}%`,
      taxa_frequencia: `${ct.attendanceRate.toFixed(1)}%`,
    }));
    exportToCSV(data, `relatorio-aulas-coletivas-${classFilters.period}`, {
      modalidade: 'Modalidade',
      aulas: 'Aulas',
      inscricoes: 'Inscrições',
      presencas: 'Presenças',
      faltas: 'Faltas',
      taxa_ocupacao: 'Taxa Ocupação',
      taxa_frequencia: 'Taxa Frequência',
    });
    toast({ title: 'Relatório exportado com sucesso!' });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise detalhada de performance e resultados</p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Período</Label>
                <Select 
                  value={filters.period} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, period: v as ReportPeriod }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Vendedor</Label>
                <Select 
                  value={filters.sellerId || 'all'} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, sellerId: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vendedores</SelectItem>
                    {sellers?.map(seller => (
                      <SelectItem key={seller.user_id} value={seller.user_id}>
                        {seller.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Plano</Label>
                <Select 
                  value={filters.planId || 'all'} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, planId: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os planos</SelectItem>
                    {plans?.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="leads" className="gap-2">
              <Users className="h-4 w-4" />
              Leads & Conversão
            </TabsTrigger>
            <TabsTrigger value="financial" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Financeiro
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <CalendarDays className="h-4 w-4" />
              Aulas Coletivas
            </TabsTrigger>
          </TabsList>

          {/* Leads Tab */}
          <TabsContent value="leads" className="space-y-6 mt-6">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total de Leads"
                value={leadsReport?.totalLeads?.toString() || '0'}
                icon={<Users className="h-5 w-5" />}
                loading={leadsLoading}
              />
              <StatCard
                title="Taxa de Conversão"
                value={`${(leadsReport?.conversionRate || 0).toFixed(1)}%`}
                subtitle={`${leadsReport?.activeClients || 0} convertidos`}
                icon={<Target className="h-5 w-5" />}
                loading={leadsLoading}
                variant="success"
              />
              <StatCard
                title="Em Negociação"
                value={leadsReport?.inNegotiation?.toString() || '0'}
                icon={<TrendingUp className="h-5 w-5" />}
                loading={leadsLoading}
                variant="warning"
              />
              <StatCard
                title="Cancelados"
                value={leadsReport?.cancelled?.toString() || '0'}
                icon={<AlertTriangle className="h-5 w-5" />}
                loading={leadsLoading}
                variant="danger"
              />
            </div>

            {/* Charts Row */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Trend Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Evolução de Leads</CardTitle>
                      <CardDescription>Leads e conversões ao longo do tempo</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleExportTrend} title="Exportar">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                  ) : leadsReport?.dailyTrend.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={leadsReport.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorLeadsR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorConvR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="leads" name="Leads" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLeadsR)" />
                        <Area type="monotone" dataKey="conversions" name="Conversões" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorConvR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado no período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Status Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Distribuição por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : leadsReport?.leadsByStatus.length ? (
                    <div className="flex items-center">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie
                            data={leadsReport.leadsByStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            stroke="none"
                          >
                            {leadsReport.leadsByStatus.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#6b7280'} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {leadsReport.leadsByStatus.map((item) => (
                          <div key={item.status} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[item.status] || '#6b7280' }} />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Source Bar */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Origem dos Leads</CardTitle>
                </CardHeader>
                <CardContent>
                  {leadsLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : leadsReport?.leadsBySource.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={leadsReport.leadsBySource.slice(0, 5)} layout="vertical">
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="Leads" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sellers Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Performance por Vendedor</CardTitle>
                    <CardDescription>Ranking de conversão da equipe</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportLeads} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {leadsLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : leadsReport?.leadsBySeller.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vendedor</TableHead>
                        <TableHead className="text-right">Leads</TableHead>
                        <TableHead className="text-right">Conversões</TableHead>
                        <TableHead className="text-right">Taxa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leadsReport.leadsBySeller.map((seller, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{seller.name}</TableCell>
                          <TableCell className="text-right">{seller.leads}</TableCell>
                          <TableCell className="text-right">{seller.conversions}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={seller.rate >= 30 ? 'default' : 'secondary'}>
                              {seller.rate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhum vendedor com leads atribuídos no período
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Tab */}
          <TabsContent value="financial" className="space-y-6 mt-6">
            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Receita Realizada"
                value={formatCurrency(financialReport?.totalRevenue || 0)}
                icon={<DollarSign className="h-5 w-5" />}
                loading={financialLoading}
                variant="success"
              />
              <StatCard
                title="Receita Esperada"
                value={formatCurrency(financialReport?.expectedRevenue || 0)}
                icon={<TrendingUp className="h-5 w-5" />}
                loading={financialLoading}
              />
              <StatCard
                title="Inadimplência"
                value={formatCurrency(financialReport?.overdueAmount || 0)}
                subtitle={`${financialReport?.overdueCount || 0} faturas`}
                icon={<AlertTriangle className="h-5 w-5" />}
                loading={financialLoading}
                variant="danger"
              />
              <StatCard
                title="Faturas Pagas"
                value={financialReport?.paidCount?.toString() || '0'}
                subtitle={`${financialReport?.pendingCount || 0} pendentes`}
                icon={<UserCheck className="h-5 w-5" />}
                loading={financialLoading}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Revenue by Month */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Receita por Período</CardTitle>
                  <CardDescription>Comparativo de receita paga, pendente e em atraso</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                  ) : financialReport?.revenueByMonth.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={financialReport.revenueByMonth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="paid" name="Pago" fill="#22c55e" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="pending" name="Pendente" fill="#f59e0b" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="overdue" name="Atrasado" fill="#ef4444" stackId="a" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado no período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Plan */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold">Receita por Plano</CardTitle>
                    <Button variant="ghost" size="icon" onClick={handleExportFinancial} title="Exportar">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : financialReport?.revenueByPlan.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={financialReport.revenueByPlan} layout="vertical">
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `R$${v/1000}k`} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={100} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" name="R$ Receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscriptions by Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Assinaturas por Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : financialReport?.subscriptionsByStatus.length ? (
                    <div className="flex items-center">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie
                            data={financialReport.subscriptionsByStatus}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="value"
                            stroke="none"
                          >
                            {financialReport.subscriptionsByStatus.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {financialReport.subscriptionsByStatus.map((item, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: ['#22c55e', '#f59e0b', '#ef4444', '#6b7280', '#8b5cf6'][index % 5] }} 
                              />
                              <span className="text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-6 mt-6">
            {/* Class-specific filters */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Filtros de Aulas</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Período</Label>
                    <Select 
                      value={classFilters.period} 
                      onValueChange={(v) => setClassFilters(prev => ({ ...prev, period: v as ClassReportPeriod }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {periodOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Modalidade</Label>
                    <Select 
                      value={classFilters.classTypeId || 'all'} 
                      onValueChange={(v) => setClassFilters(prev => ({ ...prev, classTypeId: v === 'all' ? undefined : v }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as modalidades</SelectItem>
                        {classTypes?.map(ct => (
                          <SelectItem key={ct.id} value={ct.id}>{ct.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Professor</Label>
                    <Select 
                      value={classFilters.professorId || 'all'} 
                      onValueChange={(v) => setClassFilters(prev => ({ ...prev, professorId: v === 'all' ? undefined : v }))}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os professores</SelectItem>
                        {professors.map(prof => (
                          <SelectItem key={prof.id} value={prof.id}>{prof.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* KPIs */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total de Aulas"
                value={classReport?.totalSessions?.toString() || '0'}
                subtitle={`${classReport?.cancelledSessions || 0} canceladas`}
                icon={<CalendarDays className="h-5 w-5" />}
                loading={classLoading}
              />
              <StatCard
                title="Taxa de Ocupação"
                value={`${(classReport?.occupancyRate || 0).toFixed(1)}%`}
                subtitle={`${classReport?.totalEnrollments || 0} inscrições`}
                icon={<Percent className="h-5 w-5" />}
                loading={classLoading}
                variant="success"
              />
              <StatCard
                title="Taxa de Frequência"
                value={`${(classReport?.attendanceRate || 0).toFixed(1)}%`}
                subtitle={`${classReport?.totalAttendances || 0} presenças`}
                icon={<UserCheck className="h-5 w-5" />}
                loading={classLoading}
                variant="success"
              />
              <StatCard
                title="No-Shows"
                value={classReport?.totalNoShows?.toString() || '0'}
                subtitle={`${(classReport?.noShowRate || 0).toFixed(1)}% taxa`}
                icon={<UserX className="h-5 w-5" />}
                loading={classLoading}
                variant="danger"
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Trend Chart */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold">Evolução de Aulas e Frequência</CardTitle>
                      <CardDescription>Aulas, inscrições e presenças ao longo do tempo</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {classLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                  ) : classReport?.dailyTrend.length ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={classReport.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorAttendances" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Area type="monotone" dataKey="sessions" name="Aulas" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSessions)" />
                        <Area type="monotone" dataKey="enrollments" name="Inscrições" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorEnrollments)" />
                        <Area type="monotone" dataKey="attendances" name="Presenças" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorAttendances)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado no período
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Class Type Pie */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Inscrições por Modalidade</CardTitle>
                </CardHeader>
                <CardContent>
                  {classLoading ? (
                    <Skeleton className="h-[250px] w-full" />
                  ) : classReport?.byClassType.length ? (
                    <div className="flex items-center">
                      <ResponsiveContainer width="50%" height={220}>
                        <PieChart>
                          <Pie
                            data={classReport.byClassType}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={70}
                            dataKey="enrollments"
                            stroke="none"
                          >
                            {classReport.byClassType.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color || '#6b7280'} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="flex-1 space-y-2">
                        {classReport.byClassType.slice(0, 5).map((item) => (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || '#6b7280' }} />
                              <span className="text-muted-foreground truncate max-w-[100px]">{item.name}</span>
                            </div>
                            <span className="font-medium">{item.enrollments}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Day of Week */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Aulas por Dia da Semana</CardTitle>
                </CardHeader>
                <CardContent>
                  {classLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : classReport?.byDayOfWeek.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={classReport.byDayOfWeek}>
                        <XAxis dataKey="dayName" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="enrollments" name="Inscrições" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* By Hour */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Ocupação por Horário</CardTitle>
                </CardHeader>
                <CardContent>
                  {classLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : classReport?.byHour.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={classReport.byHour}>
                        <XAxis dataKey="hourLabel" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="enrollments" name="Inscrições" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Occupancy by Class Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-semibold">Taxa de Ocupação por Modalidade</CardTitle>
                </CardHeader>
                <CardContent>
                  {classLoading ? (
                    <Skeleton className="h-[220px] w-full" />
                  ) : classReport?.byClassType.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={classReport.byClassType} layout="vertical">
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={80} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} formatter={(value: number) => `${value.toFixed(1)}%`} />
                        <Bar dataKey="occupancyRate" name="Taxa Ocupação %" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[220px] flex items-center justify-center text-muted-foreground">
                      Nenhum dado
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Class Types Table */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Performance por Modalidade</CardTitle>
                    <CardDescription>Detalhamento de cada modalidade de aula</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportClassReport} className="gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Exportar CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {classLoading ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : classReport?.byClassType.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="text-right">Aulas</TableHead>
                        <TableHead className="text-right">Inscrições</TableHead>
                        <TableHead className="text-right">Presenças</TableHead>
                        <TableHead className="text-right">No-Shows</TableHead>
                        <TableHead className="text-right">Ocupação</TableHead>
                        <TableHead className="text-right">Frequência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classReport.byClassType.map((ct) => (
                        <TableRow key={ct.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ct.color }} />
                              <span className="font-medium">{ct.name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{ct.sessions}</TableCell>
                          <TableCell className="text-right">{ct.enrollments}</TableCell>
                          <TableCell className="text-right">{ct.attendances}</TableCell>
                          <TableCell className="text-right">{ct.noShows}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={ct.occupancyRate >= 70 ? 'default' : ct.occupancyRate >= 40 ? 'secondary' : 'outline'}>
                              {ct.occupancyRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={ct.attendanceRate >= 80 ? 'default' : ct.attendanceRate >= 60 ? 'secondary' : 'outline'}>
                              {ct.attendanceRate.toFixed(1)}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    Nenhuma aula coletiva no período selecionado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
