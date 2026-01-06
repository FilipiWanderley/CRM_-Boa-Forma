import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLeads, useBirthdayLeads } from '@/hooks/useLeads';
import { useTasks } from '@/hooks/useTasks';
import { useTodayCheckIns } from '@/hooks/useCheckIns';
import { useAppointments, appointmentTypeLabels, appointmentStatusLabels } from '@/hooks/useScheduling';
import { useOverdueInvoices } from '@/hooks/useFinancial';
import { Users, UserPlus, TrendingUp, ListTodo, Clock, CalendarCheck, Calendar, Target, Activity, LogIn, ClipboardList, AlertTriangle, DollarSign, Cake, Gift, Plus, QrCode, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatCard } from './shared/StatCard';
import { QuickStatCard } from './shared/QuickStatCard';
import { CustomTooltip } from './shared/CustomTooltip';
import { useMemo, useState } from 'react';
import { exportToCSV } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { startOfWeek, endOfWeek, subWeeks, subMonths, startOfMonth, endOfMonth, isWithinInterval, parseISO, format, differenceInDays, isSameDay, eachWeekOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PeriodFilter = '4weeks' | '3months' | '6months';

const periodOptions = [
  { value: '4weeks', label: 'Últimas 4 semanas' },
  { value: '3months', label: 'Últimos 3 meses' },
  { value: '6months', label: 'Últimos 6 meses' },
];

export function DashboardRecepcao() {
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('4weeks');
  
  const { data: leads, isLoading: leadsLoading } = useLeads();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: todayCheckIns, isLoading: checkInsLoading } = useTodayCheckIns();
  const { data: overdueInvoices, isLoading: invoicesLoading } = useOverdueInvoices();
  const { data: birthdayLeads, isLoading: birthdaysLoading } = useBirthdayLeads();
  
  // Agendamentos de hoje
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: todayAppointments, isLoading: appointmentsLoading } = useAppointments(today);

  const totalLeads = leads?.length || 0;
  const newLeads = leads?.filter(l => l.status === 'lead').length || 0;
  const scheduledVisits = leads?.filter(l => l.status === 'visita_agendada').length || 0;
  const inNegotiation = leads?.filter(l => l.status === 'negociacao').length || 0;
  const activeClients = leads?.filter(l => l.status === 'ativo').length || 0;

  const pendingTasks = tasks?.filter(t => !t.is_completed).length || 0;
  const todayTasks = tasks?.filter(t => {
    if (!t.due_date) return false;
    const today = new Date();
    const dueDate = new Date(t.due_date);
    return dueDate.toDateString() === today.toDateString();
  }).length || 0;

  // Pipeline status data for pie chart
  const pipelineStatusData = [
    { name: 'Novos Leads', value: newLeads, color: '#f59e0b' },
    { name: 'Visita Agendada', value: scheduledVisits, color: '#22c55e' },
    { name: 'Em Negociação', value: inNegotiation, color: 'hsl(var(--primary))' },
    { name: 'Ativos', value: activeClients, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  // Calculate chart data based on period filter
  const chartData = useMemo(() => {
    if (!leads) return [];

    const now = new Date();

    if (periodFilter === '4weeks') {
      const data = [];
      for (let i = 3; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 0 });
        const weekEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 0 });

        const leadsInWeek = leads.filter(lead => {
          const createdAt = parseISO(lead.created_at);
          return isWithinInterval(createdAt, { start: weekStart, end: weekEnd });
        });

        const conversionsInWeek = leads.filter(lead => {
          const createdAt = parseISO(lead.created_at);
          return isWithinInterval(createdAt, { start: weekStart, end: weekEnd }) && lead.status === 'ativo';
        });

        data.push({
          name: `Sem ${4 - i}`,
          leads: leadsInWeek.length,
          conversoes: conversionsInWeek.length,
        });
      }
      return data;
    }

    // For 3 or 6 months, group by month
    const monthsCount = periodFilter === '3months' ? 3 : 6;
    const data = [];

    for (let i = monthsCount - 1; i >= 0; i--) {
      const monthStart = startOfMonth(subMonths(now, i));
      const monthEnd = endOfMonth(subMonths(now, i));

      const leadsInMonth = leads.filter(lead => {
        const createdAt = parseISO(lead.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd });
      });

      const conversionsInMonth = leads.filter(lead => {
        const createdAt = parseISO(lead.created_at);
        return isWithinInterval(createdAt, { start: monthStart, end: monthEnd }) && lead.status === 'ativo';
      });

      data.push({
        name: format(monthStart, 'MMM', { locale: ptBR }),
        leads: leadsInMonth.length,
        conversoes: conversionsInMonth.length,
      });
    }

    return data;
  }, [leads, periodFilter]);

  // Recent leads
  const recentLeads = leads?.slice(0, 5) || [];

  const handleExportChart = () => {
    if (!chartData || chartData.length === 0) {
      toast({ title: 'Sem dados para exportar', variant: 'destructive' });
      return;
    }
    const headers = { name: 'Período', leads: 'Leads', conversoes: 'Conversões' };
    exportToCSV(chartData as Record<string, string | number>[], `leads-recepcao-${periodFilter}`, headers);
    toast({ title: 'Dados exportados com sucesso!' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard da Recepção</h1>
          <p className="text-sm text-muted-foreground">Gerencie leads e agendamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" className="gap-2">
            <Link to="/leads/novo">
              <Plus className="h-4 w-4" />
              Novo Lead
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link to="/scheduling">
              <CalendarCheck className="h-4 w-4" />
              Agendar Visita
            </Link>
          </Button>
          <Button asChild size="sm" variant="secondary" className="gap-2">
            <Link to="/aluno">
              <QrCode className="h-4 w-4" />
              Check-in
            </Link>
          </Button>
        </div>
      </div>

      {/* Main KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total de Leads"
          value={totalLeads.toString()}
          icon={<Users className="h-5 w-5" />}
          loading={leadsLoading}
          href="/leads"
          variant="default"
        />
        <StatCard
          title="Novos Leads"
          value={newLeads.toString()}
          subtitle="aguardando contato"
          icon={<UserPlus className="h-5 w-5" />}
          loading={leadsLoading}
          href="/pipeline"
          variant="warning"
        />
        <StatCard
          title="Visitas Agendadas"
          value={scheduledVisits.toString()}
          subtitle="esta semana"
          icon={<CalendarCheck className="h-5 w-5" />}
          loading={leadsLoading}
          href="/pipeline"
          variant="success"
        />
        <StatCard
          title="Em Negociação"
          value={inNegotiation.toString()}
          subtitle="propostas abertas"
          icon={<TrendingUp className="h-5 w-5" />}
          loading={leadsLoading}
          href="/pipeline"
          variant="info"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leads Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-semibold">
                  {periodFilter === '4weeks' ? 'Leads por Semana' : 'Leads por Mês'}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={handleExportChart}
                  title="Exportar dados"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
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
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-muted-foreground">Leads</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-muted-foreground">Conversões</span>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {leadsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLeadsRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorConversoes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="leads" name="Leads" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorLeadsRec)" />
                  <Area type="monotone" dataKey="conversoes" name="Conversões" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorConversoes)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pipeline Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Status do Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {leadsLoading ? (
              <Skeleton className="h-[180px] w-[180px] rounded-full" />
            ) : pipelineStatusData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={pipelineStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pipelineStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  {pipelineStatusData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                Nenhum lead encontrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leads & Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Leads */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Leads Recentes</CardTitle>
              <Link to="/leads" className="text-xs text-primary hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {leadsLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : recentLeads.length > 0 ? (
              recentLeads.map((lead, index) => (
                <Link
                  key={lead.id}
                  to={`/leads/${lead.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {lead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{lead.full_name}</p>
                    <p className="text-xs text-muted-foreground">{lead.phone}</p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      lead.status === 'lead' ? 'border-amber-500/30 text-amber-500' :
                      lead.status === 'visita_agendada' ? 'border-emerald-500/30 text-emerald-500' :
                      lead.status === 'negociacao' ? 'border-primary/30 text-primary' :
                      lead.status === 'ativo' ? 'border-blue-500/30 text-blue-500' : ''
                    }`}
                  >
                    {lead.status === 'lead' ? 'Novo' :
                     lead.status === 'visita_agendada' ? 'Visita' :
                     lead.status === 'negociacao' ? 'Negociação' :
                     lead.status === 'ativo' ? 'Ativo' : lead.status}
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum lead encontrado
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Minhas Tarefas</CardTitle>
              <Link to="/tasks" className="text-xs text-primary hover:underline">Ver todas</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasksLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : tasks && tasks.filter(t => !t.is_completed).length > 0 ? (
              tasks
                .filter(t => !t.is_completed)
                .slice(0, 5)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-2 rounded-lg ${
                      task.priority === 'high' ? 'bg-red-500/10' :
                      task.priority === 'medium' ? 'bg-amber-500/10' : 'bg-muted'
                    }`}>
                      <ListTodo className={`h-4 w-4 ${
                        task.priority === 'high' ? 'text-red-500' :
                        task.priority === 'medium' ? 'text-amber-500' : 'text-muted-foreground'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(task.due_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant="outline"
                      className={`text-xs ${
                        task.priority === 'high' ? 'border-red-500/30 text-red-500' :
                        task.priority === 'medium' ? 'border-amber-500/30 text-amber-500' : ''
                      }`}
                    >
                      {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Média' : 'Baixa'}
                    </Badge>
                  </div>
                ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhuma tarefa pendente
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agendamentos de Hoje */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <ClipboardList className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Agendamentos de Hoje</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {todayAppointments?.filter(a => a.status !== 'cancelled').length || 0} compromissos
                </p>
              </div>
            </div>
            <Link to="/scheduling" className="text-xs text-primary hover:underline">Ver agenda</Link>
          </div>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : todayAppointments && todayAppointments.filter(a => a.status !== 'cancelled').length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {todayAppointments
                .filter(a => a.status !== 'cancelled')
                .slice(0, 6)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-xs font-semibold ${
                        appointment.type === 'aula_experimental' ? 'bg-amber-500/10 text-amber-500' :
                        appointment.type === 'avaliacao_fisica' ? 'bg-blue-500/10 text-blue-500' :
                        'bg-primary/10 text-primary'
                      }`}>
                        {appointment.lead?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">
                        {appointment.lead?.full_name || appointment.title}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          appointment.type === 'aula_experimental' ? 'border-amber-500/30 text-amber-500' :
                          appointment.type === 'avaliacao_fisica' ? 'border-blue-500/30 text-blue-500' :
                          'border-primary/30 text-primary'
                        }`}
                      >
                        {appointmentTypeLabels[appointment.type]}
                      </Badge>
                      <span className={`text-[10px] ${
                        appointment.status === 'confirmed' ? 'text-emerald-500' :
                        appointment.status === 'completed' ? 'text-blue-500' :
                        'text-muted-foreground'
                      }`}>
                        {appointmentStatusLabels[appointment.status]}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum agendamento para hoje
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-ins de Hoje */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <LogIn className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Check-ins de Hoje</CardTitle>
                <p className="text-xs text-muted-foreground">{todayCheckIns?.length || 0} entradas registradas</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {checkInsLoading ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : todayCheckIns && todayCheckIns.length > 0 ? (
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {todayCheckIns.slice(0, 9).map((checkIn: any) => (
                <div
                  key={checkIn.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-xs font-semibold">
                      {checkIn.lead?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {checkIn.lead?.full_name || 'Aluno'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(checkIn.checked_in_at), 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    className="text-xs border-emerald-500/30 text-emerald-500"
                  >
                    {checkIn.method === 'qr_code' ? 'QR Code' : checkIn.method === 'manual' ? 'Manual' : checkIn.method}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">
              Nenhum check-in registrado hoje
            </div>
          )}
        </CardContent>
      </Card>

      {/* Alertas de Inadimplência */}
      {overdueInvoices && overdueInvoices.length > 0 && (
        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-red-500">Alertas de Inadimplência</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {overdueInvoices.filter(i => i.status === 'overdue').length} vencidas, {overdueInvoices.filter(i => i.status === 'pending').length} pendentes
                  </p>
                </div>
              </div>
              <Link to="/financial" className="text-xs text-primary hover:underline">Ver financeiro</Link>
            </div>
          </CardHeader>
          <CardContent>
            {invoicesLoading ? (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {overdueInvoices.slice(0, 6).map((invoice: any) => {
                  const daysOverdue = differenceInDays(new Date(), parseISO(invoice.due_date));
                  const isOverdue = invoice.status === 'overdue';
                  
                  return (
                    <div
                      key={invoice.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isOverdue ? 'bg-red-500/10 hover:bg-red-500/15' : 'bg-amber-500/10 hover:bg-amber-500/15'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-xs font-semibold ${
                          isOverdue ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                        }`}>
                          {invoice.lead?.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {invoice.lead?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          R$ {Number(invoice.amount).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge 
                          variant="outline"
                          className={`text-xs ${
                            isOverdue ? 'border-red-500/30 text-red-500' : 'border-amber-500/30 text-amber-500'
                          }`}
                        >
                          {isOverdue ? 'Vencida' : 'Pendente'}
                        </Badge>
                        <span className={`text-[10px] ${isOverdue ? 'text-red-400' : 'text-amber-400'}`}>
                          {isOverdue ? `${daysOverdue}d atraso` : format(parseISO(invoice.due_date), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Aniversariantes do Mês */}
      {birthdayLeads && birthdayLeads.length > 0 && (
        <Card className="border-pink-500/20 bg-gradient-to-br from-pink-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Cake className="h-5 w-5 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold text-pink-500">Aniversariantes do Mês</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {birthdayLeads.length} aniversariante{birthdayLeads.length > 1 ? 's' : ''} em {format(new Date(), 'MMMM', { locale: ptBR })}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {birthdaysLoading ? (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {birthdayLeads.slice(0, 8).map((lead) => {
                  const birthDate = new Date(lead.birth_date!);
                  const todayDate = new Date();
                  const birthdayThisYear = new Date(todayDate.getFullYear(), birthDate.getMonth(), birthDate.getDate());
                  const isToday = isSameDay(birthdayThisYear, todayDate);
                  const daysUntil = differenceInDays(birthdayThisYear, todayDate);
                  const isPast = daysUntil < 0;
                  
                  return (
                    <Link
                      key={lead.id}
                      to={`/leads/${lead.id}`}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        isToday ? 'bg-pink-500/20 hover:bg-pink-500/25 ring-1 ring-pink-500/30' : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className={`text-xs font-semibold ${
                          isToday ? 'bg-pink-500/30 text-pink-500' : 'bg-pink-500/10 text-pink-400'
                        }`}>
                          {lead.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">
                          {lead.full_name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Gift className="h-3 w-3" />
                          {format(birthDate, 'dd/MM', { locale: ptBR })}
                        </p>
                      </div>
                      <Badge 
                        variant="outline"
                        className={`text-xs ${
                          isToday ? 'border-pink-500/50 text-pink-500 bg-pink-500/10' :
                          isPast ? 'border-muted-foreground/30 text-muted-foreground' :
                          'border-pink-400/30 text-pink-400'
                        }`}
                      >
                        {isToday ? '🎂 Hoje!' : isPast ? 'Passou' : `Em ${daysUntil}d`}
                      </Badge>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-4">
        <QuickStatCard
          title="Clientes Ativos"
          value={activeClients}
          icon={<Users className="h-5 w-5" />}
          variant="success"
          loading={leadsLoading}
        />
        <QuickStatCard
          title="Check-ins Hoje"
          value={todayCheckIns?.length || 0}
          icon={<LogIn className="h-5 w-5" />}
          variant="info"
          loading={checkInsLoading}
        />
        <QuickStatCard
          title="Faturas Pendentes"
          value={overdueInvoices?.length || 0}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant={overdueInvoices && overdueInvoices.some(i => i.status === 'overdue') ? 'danger' : 'warning'}
          loading={invoicesLoading}
        />
        <QuickStatCard
          title="Taxa de Conversão"
          value={totalLeads > 0 ? `${((activeClients / totalLeads) * 100).toFixed(0)}%` : '0%'}
          icon={<Target className="h-5 w-5" />}
          variant="primary"
          loading={leadsLoading}
        />
      </div>
    </div>
  );
}
