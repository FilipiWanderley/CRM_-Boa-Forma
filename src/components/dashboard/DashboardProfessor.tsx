import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { useProfessorStats } from '@/hooks/useProfessorStats';
import { Users, Dumbbell, ListTodo, Clock, Calendar, Activity, ClipboardList, TrendingUp, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatCard } from './shared/StatCard';
import { QuickStatCard } from './shared/QuickStatCard';
import { CustomTooltip } from './shared/CustomTooltip';
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

export function DashboardProfessor() {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: stats, isLoading: statsLoading } = useProfessorStats();

  const pendingTasks = tasks?.filter(t => !t.is_completed).length || 0;
  const todayTasks = tasks?.filter(t => {
    if (!t.due_date) return false;
    const today = new Date();
    const dueDate = new Date(t.due_date);
    return dueDate.toDateString() === today.toDateString();
  }).length || 0;

  // Workout status data for pie chart
  const workoutStatusData = [
    { name: 'Ativos', value: stats?.activeWorkouts || 0, color: 'hsl(var(--primary))' },
    { name: 'Inativos', value: (stats?.totalWorkouts || 0) - (stats?.activeWorkouts || 0), color: '#ef4444' },
  ].filter(d => d.value > 0);

  // Mock data for students activity (last 7 days)
  const activityData = [
    { name: 'Seg', treinos: 4 },
    { name: 'Ter', treinos: 6 },
    { name: 'Qua', treinos: 3 },
    { name: 'Qui', treinos: 8 },
    { name: 'Sex', treinos: 5 },
    { name: 'Sáb', treinos: 2 },
    { name: 'Dom', treinos: 1 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Dashboard do Professor</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus alunos e treinos</p>
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
          value={(stats?.activeStudents || 0).toString()}
          subtitle={`de ${stats?.totalStudents || 0} total`}
          icon={<Users className="h-5 w-5" />}
          loading={statsLoading}
          href="/meus-alunos"
          variant="success"
        />
        <StatCard
          title="Treinos Criados"
          value={(stats?.totalWorkouts || 0).toString()}
          subtitle={`${stats?.activeWorkouts || 0} ativos`}
          icon={<Dumbbell className="h-5 w-5" />}
          loading={statsLoading}
          href="/workouts"
          variant="default"
        />
        <StatCard
          title="Avaliações Pendentes"
          value={(stats?.pendingAssessments || 0).toString()}
          subtitle="agendadas"
          icon={<ClipboardList className="h-5 w-5" />}
          loading={statsLoading}
          href="/avaliacoes"
          variant="info"
        />
        <StatCard
          title="Tarefas Pendentes"
          value={pendingTasks.toString()}
          subtitle={`${todayTasks} para hoje`}
          icon={<ListTodo className="h-5 w-5" />}
          loading={tasksLoading}
          href="/tasks"
          variant="warning"
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Atividade dos Alunos</CardTitle>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Treinos</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-[220px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTreinos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="treinos" name="Treinos" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTreinos)" />
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
            {statsLoading ? (
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

      {/* Students & Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Students */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Meus Alunos</CardTitle>
              <Link to="/meus-alunos" className="text-xs text-primary hover:underline">Ver todos</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {statsLoading ? (
              <>
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </>
            ) : stats?.students && stats.students.length > 0 ? (
              stats.students.slice(0, 5).map((student: any, index: number) => (
                <Link
                  key={student.id}
                  to={`/leads/${student.id}`}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center w-6 h-6">
                    {index < 3 ? (
                      <Badge className={`${
                        index === 0 ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                        index === 1 ? 'bg-slate-400/20 text-slate-400 border-slate-400/30' :
                        'bg-orange-400/20 text-orange-400 border-orange-400/30'
                      } border text-xs px-1.5`}>
                        #{index + 1}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">#{index + 1}</span>
                    )}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {student.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{student.full_name}</p>
                    <p className="text-xs text-muted-foreground">{student.phone}</p>
                  </div>
                  <Badge variant={student.status === 'ativo' ? 'default' : 'secondary'} className="text-xs">
                    {student.status === 'ativo' ? 'Ativo' : student.status}
                  </Badge>
                </Link>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground text-sm">
                Nenhum aluno ainda
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">Tarefas de Hoje</CardTitle>
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

      {/* Quick Stats Footer */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickStatCard
          title="Alunos Ativos"
          value={stats?.activeStudents || 0}
          icon={<Users className="h-5 w-5" />}
          variant="success"
          loading={statsLoading}
        />
        <QuickStatCard
          title="Treinos Ativos"
          value={stats?.activeWorkouts || 0}
          icon={<Dumbbell className="h-5 w-5" />}
          variant="primary"
          loading={statsLoading}
        />
        <QuickStatCard
          title="Tarefas Hoje"
          value={todayTasks}
          icon={<Target className="h-5 w-5" />}
          variant="warning"
          loading={tasksLoading}
        />
      </div>
    </div>
  );
}
