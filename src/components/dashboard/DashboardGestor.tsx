import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  UserCheck,
  UserMinus,
  Activity,
  MoreVertical,
  ArrowUpRight,
  Target,
  Percent,
  Calendar,
  Download
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useDashboardStats, useFilteredChartData, useTopSellers, ChartPeriodFilter } from '@/hooks/useDashboardStats';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import { GoalsSection } from '@/components/goals/GoalsSection';
import { RecentActivities } from '@/components/dashboard/RecentActivities';
import { NpsWidget } from '@/components/dashboard/NpsWidget';

const periodOptions = [
  { value: '4weeks', label: 'Últimas 4 semanas' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: '6months', label: 'Últimos 6 meses' },
];

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  loading?: boolean;
  href?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, change, icon, loading, href, variant = 'default' }: StatCardProps) {
  const variantStyles = {
    default: 'bg-primary/10',
    success: 'bg-emerald-500/10',
    warning: 'bg-amber-500/10',
    danger: 'bg-red-500/10',
  };
  
  const iconColors = {
    default: 'text-primary',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
  };
  
  return (
    <Card className="bg-card border border-border/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${variantStyles[variant]}`}>
            <div className={iconColors[variant]}>{icon}</div>
          </div>
          {href && (
            <Link to={href} className="text-muted-foreground hover:text-primary transition-colors">
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">{title}</p>
        {loading ? (
          <Skeleton className="h-8 w-24" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <div className={`flex items-center gap-0.5 text-xs font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{change >= 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}: {entry.name === 'Receita' ? `R$ ${entry.value.toLocaleString('pt-BR')}` : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Top Seller Row
interface SellerRowProps {
  name: string;
  avatarUrl?: string | null;
  leads: number;
  conversions: number;
  conversionRate: number;
  rank: number;
}

function SellerRow({ name, avatarUrl, leads, conversions, conversionRate, rank }: SellerRowProps) {
  const badgeVariants: Record<number, string> = {
    1: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    2: 'bg-slate-400/20 text-slate-400 border-slate-400/30',
    3: 'bg-orange-400/20 text-orange-400 border-orange-400/30',
  };
  
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-center w-6 h-6">
        {rank <= 3 ? (
          <Badge className={`${badgeVariants[rank]} border text-xs px-1.5`}>
            #{rank}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">#{rank}</span>
        )}
      </div>
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl || undefined} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{name}</p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-foreground">{conversions}</p>
        <p className="text-xs text-muted-foreground">{leads} leads</p>
      </div>
      <div className="text-right min-w-[50px]">
        <p className="text-xs font-medium text-emerald-500">{conversionRate.toFixed(0)}%</p>
      </div>
    </div>
  );
}

export function DashboardGestor() {
  const [periodFilter, setPeriodFilter] = useState<ChartPeriodFilter>('6months');
  
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useFilteredChartData(periodFilter);
  const { data: topSellers, isLoading: sellersLoading } = useTopSellers();

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExportLeadsChart = () => {
    if (!chartData || chartData.length === 0) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const headers = { name: 'Período', leads: 'Leads', conversions: 'Conversões', revenue: 'Receita (R$)' };
    exportToCSV(chartData, `leads-conversoes-${periodFilter}`, headers);
    toast({ title: 'Dados exportados com sucesso!' });
  };

  const handleExportRevenueChart = () => {
    if (!chartData || chartData.length === 0) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const revenueData = chartData.map(d => ({ name: d.name, revenue: d.revenue }));
    const headers = { name: 'Período', revenue: 'Receita (R$)' };
    exportToCSV(revenueData, `receita-${periodFilter}`, headers);
    toast({ title: 'Dados exportados com sucesso!' });
  };

  // Pie chart data for client status
  const clientStatusData = stats ? [
    { name: 'Ativos', value: stats.activeClients, color: 'hsl(var(--primary))' },
    { name: 'Inadimplentes', value: stats.overdueCount, color: '#f59e0b' },
    { name: 'Inativos', value: stats.inactiveClients, color: '#ef4444' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Receita do Mês"
          value={statsLoading ? '...' : formatCurrency(stats?.currentMonthRevenue || 0)}
          change={stats?.revenueGrowth}
          icon={<DollarSign className="h-5 w-5" />}
          loading={statsLoading}
          href="/financial"
          variant="success"
        />
        <StatCard
          title="Inadimplência"
          value={statsLoading ? '...' : formatCurrency(stats?.overdueAmount || 0)}
          icon={<AlertTriangle className="h-5 w-5" />}
          loading={statsLoading}
          href="/financial"
          variant="danger"
        />
        <StatCard
          title="Alunos Ativos"
          value={statsLoading ? '...' : (stats?.activeClients || 0).toString()}
          icon={<UserCheck className="h-5 w-5" />}
          loading={statsLoading}
          href="/leads"
          variant="default"
        />
        <StatCard
          title="Novos Leads"
          value={statsLoading ? '...' : (stats?.newLeadsThisMonth || 0).toString()}
          change={stats?.leadsGrowth}
          icon={<Users className="h-5 w-5" />}
          loading={statsLoading}
          href="/leads"
          variant="default"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Taxa de Conversão"
          value={statsLoading ? '...' : `${(stats?.conversionRate || 0).toFixed(1)}%`}
          icon={<Target className="h-5 w-5" />}
          loading={statsLoading}
          href="/pipeline"
        />
        <StatCard
          title="Taxa de Churn"
          value={statsLoading ? '...' : `${(stats?.churnRate || 0).toFixed(1)}%`}
          icon={<UserMinus className="h-5 w-5" />}
          loading={statsLoading}
          variant={stats?.churnRate && stats.churnRate > 5 ? 'warning' : 'default'}
        />
        <StatCard
          title="Inadimplência %"
          value={statsLoading ? '...' : `${(stats?.delinquencyRate || 0).toFixed(1)}%`}
          icon={<Percent className="h-5 w-5" />}
          loading={statsLoading}
          variant={stats?.delinquencyRate && stats.delinquencyRate > 10 ? 'danger' : 'default'}
        />
        <StatCard
          title="Check-ins/Mês"
          value={statsLoading ? '...' : (stats?.totalCheckInsThisMonth || 0).toString()}
          icon={<Activity className="h-5 w-5" />}
          loading={statsLoading}
        />
      </div>

      {/* Goals Section */}
      <GoalsSection />

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads & Conversions Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {periodFilter === '4weeks' ? 'Leads e Conversões por Semana' : 'Leads e Conversões por Mês'}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleExportLeadsChart}
                  title="Exportar dados"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as ChartPeriodFilter)}>
                  <SelectTrigger className="w-[160px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {periodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-xs">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-muted-foreground">Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                    <span className="text-muted-foreground">Conversões</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#f87171" strokeWidth={2} fillOpacity={1} fill="url(#colorLeads)" />
                  <Area type="monotone" dataKey="conversions" name="Conversões" stroke="#818cf8" strokeWidth={2} fillOpacity={1} fill="url(#colorConversions)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Client Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status dos Alunos</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {statsLoading ? (
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            ) : clientStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={clientStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {clientStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {clientStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum dado disponível
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart & Top Sellers & Recent Activities */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Revenue */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                {periodFilter === '4weeks' ? 'Receita por Semana' : 'Receita Mensal'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7" 
                onClick={handleExportRevenueChart}
                title="Exportar dados"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {chartLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v/1000}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" name="Receita" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Top Sellers & Recent Activities */}
        <div className="space-y-6">
          {/* NPS Widget */}
          <NpsWidget />

          {/* Top Sellers */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Top Vendedores</CardTitle>
                <Link to="/users" className="text-xs text-primary hover:underline">Ver todos</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {sellersLoading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : topSellers && topSellers.length > 0 ? (
                topSellers.map((seller, index) => (
                  <SellerRow
                    key={seller.userId}
                    rank={index + 1}
                    name={seller.name}
                    avatarUrl={seller.avatarUrl}
                    leads={seller.leads}
                    conversions={seller.conversions}
                    conversionRate={seller.conversionRate}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum vendedor com leads atribuídos
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <RecentActivities />
        </div>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-500/20">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Média Check-ins/Aluno</p>
              <p className="text-xl font-bold text-foreground">
                {statsLoading ? '...' : (stats?.avgCheckInsPerClient || 0).toFixed(1)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Alunos Inativos</p>
              <p className="text-xl font-bold text-foreground">
                {statsLoading ? '...' : stats?.inactiveClients || 0}
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  ({(stats?.inactivityRate || 0).toFixed(0)}%)
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-full bg-red-500/20">
              <UserMinus className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Cancelamentos no Mês</p>
              <p className="text-xl font-bold text-foreground">
                {statsLoading ? '...' : stats?.churnedThisMonth || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
