import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  BarChart3, 
  Users, 
  Dumbbell, 
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Calendar,
  Activity,
  Target,
  ArrowUpRight
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Stat Card Component (same style as DashboardGestor)
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
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Student Row Component
interface StudentRowProps {
  name: string;
  count: number;
  rank: number;
}

function StudentRow({ name, count, rank }: StudentRowProps) {
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
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
          {name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-foreground truncate">{name}</p>
      </div>
      <div className="text-right flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold text-foreground">{count}</p>
      </div>
    </div>
  );
}

export default function ProfessorReports() {
  const { profile } = useAuth();

  // Fetch workouts created by professor
  const { data: workoutsData, isLoading: workoutsLoading } = useQuery({
    queryKey: ['professor-workouts-report', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('id, name, created_at, is_active, lead_id')
        .eq('created_by', profile?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch workout logs (executions)
  const { data: workoutLogsData, isLoading: logsLoading } = useQuery({
    queryKey: ['professor-workout-logs-report', profile?.unit_id],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString();
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, completed_at, workout_id, lead_id')
        .gte('completed_at', thirtyDaysAgo);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.unit_id,
  });

  // Fetch physical assessments
  const { data: assessmentsData, isLoading: assessmentsLoading } = useQuery({
    queryKey: ['professor-assessments-report', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('physical_assessments')
        .select('id, assessment_date, lead_id')
        .eq('assessed_by', profile?.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  // Fetch students assigned to professor
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['professor-students-report', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('id, full_name, status, created_at')
        .eq('assigned_to', profile?.id)
        .eq('status', 'ativo');
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.id,
  });

  const isLoading = workoutsLoading || logsLoading || assessmentsLoading || studentsLoading;

  // Calculate statistics
  const totalWorkouts = workoutsData?.length || 0;
  const activeWorkouts = workoutsData?.filter(w => w.is_active)?.length || 0;
  const totalAssessments = assessmentsData?.length || 0;
  const totalStudents = studentsData?.length || 0;
  const totalWorkoutExecutions = workoutLogsData?.length || 0;

  // Workouts per month (last 6 months)
  const workoutsPerMonth = () => {
    if (!workoutsData) return [];
    const months: { [key: string]: number } = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = subDays(new Date(), i * 30);
      const key = format(date, 'MMM', { locale: ptBR });
      months[key] = 0;
    }
    
    workoutsData.forEach(w => {
      const key = format(new Date(w.created_at), 'MMM', { locale: ptBR });
      if (months[key] !== undefined) {
        months[key]++;
      }
    });
    
    return Object.entries(months).map(([name, value]) => ({ name, treinos: value }));
  };

  // Workout executions per day (last 7 days)
  const executionsPerDay = () => {
    if (!workoutLogsData) return [];
    const days: { [key: string]: number } = {};
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const key = format(date, 'EEE', { locale: ptBR });
      days[key] = 0;
    }
    
    workoutLogsData.forEach(log => {
      const key = format(new Date(log.completed_at), 'EEE', { locale: ptBR });
      if (days[key] !== undefined) {
        days[key]++;
      }
    });
    
    return Object.entries(days).map(([name, value]) => ({ name, execucoes: value }));
  };

  // Students with most workouts
  const topStudents = () => {
    if (!workoutLogsData || !studentsData) return [];
    const studentCounts: { [key: string]: { name: string; count: number } } = {};
    
    studentsData.forEach(s => {
      studentCounts[s.id] = { name: s.full_name, count: 0 };
    });
    
    workoutLogsData.forEach(log => {
      if (studentCounts[log.lead_id]) {
        studentCounts[log.lead_id].count++;
      }
    });
    
    return Object.values(studentCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // Workout status distribution
  const workoutStatusData = [
    { name: 'Ativos', value: activeWorkouts, color: 'hsl(var(--primary))' },
    { name: 'Inativos', value: totalWorkouts - activeWorkouts, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Acompanhe suas estatísticas e desempenho dos alunos</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Main KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Alunos Ativos"
            value={totalStudents.toString()}
            icon={<Users className="h-5 w-5" />}
            loading={isLoading}
            href="/meus-alunos"
            variant="default"
          />
          <StatCard
            title="Treinos Criados"
            value={totalWorkouts.toString()}
            icon={<Dumbbell className="h-5 w-5" />}
            loading={isLoading}
            href="/workouts"
            variant="success"
          />
          <StatCard
            title="Avaliações Físicas"
            value={totalAssessments.toString()}
            icon={<ClipboardList className="h-5 w-5" />}
            loading={isLoading}
            href="/avaliacoes"
            variant="default"
          />
          <StatCard
            title="Execuções (30d)"
            value={totalWorkoutExecutions.toString()}
            icon={<Activity className="h-5 w-5" />}
            loading={isLoading}
            variant="success"
          />
        </div>

        {/* Secondary KPIs */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Treinos Ativos"
            value={activeWorkouts.toString()}
            icon={<Target className="h-5 w-5" />}
            loading={isLoading}
          />
          <StatCard
            title="Treinos Inativos"
            value={(totalWorkouts - activeWorkouts).toString()}
            icon={<Dumbbell className="h-5 w-5" />}
            loading={isLoading}
            variant={totalWorkouts - activeWorkouts > activeWorkouts ? 'warning' : 'default'}
          />
          <StatCard
            title="Média Exec./Aluno"
            value={totalStudents > 0 ? (totalWorkoutExecutions / totalStudents).toFixed(1) : '0'}
            icon={<BarChart3 className="h-5 w-5" />}
            loading={isLoading}
          />
          <StatCard
            title="Treinos/Aluno"
            value={totalStudents > 0 ? (totalWorkouts / totalStudents).toFixed(1) : '0'}
            icon={<Dumbbell className="h-5 w-5" />}
            loading={isLoading}
          />
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Executions Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Execuções por Dia</CardTitle>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Execuções</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[220px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={executionsPerDay()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorExecucoes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="execucoes" name="Execuções" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorExecucoes)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Workout Status Pie */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Status dos Treinos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {isLoading ? (
                <Skeleton className="h-[180px] w-[180px] rounded-full" />
              ) : workoutStatusData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={workoutStatusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {workoutStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-3 mt-2">
                    {workoutStatusData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-1.5 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-muted-foreground">{entry.name}: {entry.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-muted-foreground text-sm">
                  Nenhum treino criado
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Workouts Chart & Top Students */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Workouts per Month Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Treinos Criados por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={workoutsPerMonth()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="treinos" name="Treinos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top Students */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Alunos Mais Ativos</CardTitle>
                <Link to="/meus-alunos" className="text-xs text-primary hover:underline">Ver todos</Link>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </>
              ) : topStudents().length > 0 ? (
                topStudents().map((student, index) => (
                  <StudentRow
                    key={index}
                    rank={index + 1}
                    name={student.name}
                    count={student.count}
                  />
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground text-sm">
                  Nenhum dado disponível
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats Footer */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-emerald-500/20">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Treinos Ativos</p>
                <p className="text-xl font-bold text-foreground">
                  {isLoading ? '...' : activeWorkouts}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Alunos</p>
                <p className="text-xl font-bold text-foreground">
                  {isLoading ? '...' : totalStudents}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-full bg-amber-500/20">
                <ClipboardList className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avaliações Realizadas</p>
                <p className="text-xl font-bold text-foreground">
                  {isLoading ? '...' : totalAssessments}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
