import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTasks } from '@/hooks/useTasks';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/shared';
import { ListTodo, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { CreateTaskDialog } from '@/components/tasks/CreateTaskDialog';
import { TaskCard } from '@/components/tasks/TaskCard';

export default function Tasks() {
  const { data: tasks, isLoading } = useTasks();

  const pendingTasks = tasks?.filter(t => !t.is_completed) || [];
  const completedTasks = tasks?.filter(t => t.is_completed) || [];
  const highPriorityTasks = pendingTasks.filter(t => t.priority === 'high');

  // Sort pending by priority and due date
  const sortedPending = [...pendingTasks].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 1;
    const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 1;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date) return -1;
    if (b.due_date) return 1;
    return 0;
  });

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Tarefas"
          subtitle="Gerencie suas atividades e follow-ups"
          actions={<CreateTaskDialog />}
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Tarefas Pendentes"
            value={pendingTasks.length}
            change={-5}
            icon={<Clock className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Alta Prioridade"
            value={highPriorityTasks.length}
            icon={<AlertCircle className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Concluídas"
            value={completedTasks.length}
            change={12}
            icon={<CheckCircle2 className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Tasks */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-warning/10">
                  <ListTodo className="h-5 w-5 text-warning" />
                </div>
                Pendentes
                <span className="ml-auto text-sm font-normal text-muted-foreground">
                  {pendingTasks.length} {pendingTasks.length === 1 ? 'tarefa' : 'tarefas'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isLoading ? (
                <>
                  <Skeleton className="h-20 w-full rounded-xl" />
                  <Skeleton className="h-20 w-full rounded-xl" />
                </>
              ) : sortedPending.length > 0 ? (
                sortedPending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-sm">Nenhuma tarefa pendente</p>
                  <p className="text-xs">Você está em dia!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tasks */}
          <Card className="border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <div className="p-2 rounded-lg bg-muted">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                Concluídas
                <span className="ml-auto text-sm font-normal">
                  {completedTasks.length} {completedTasks.length === 1 ? 'tarefa' : 'tarefas'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
              {completedTasks.length > 0 ? (
                completedTasks.slice(0, 20).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <p className="text-sm">Nenhuma tarefa concluída</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
