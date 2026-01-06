import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader, StatCard } from '@/components/shared';
import { 
  Plus, 
  ClipboardList, 
  Search, 
  User, 
  Dumbbell,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useLeads } from '@/hooks/useLeads';
import { CreateWorkoutDialog } from '@/components/workouts/CreateWorkoutDialog';

export default function Workouts() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: workouts, isLoading: workoutsLoading } = useWorkouts();
  const { data: leads } = useLeads('ativo');

  // Create a map of lead_id to lead for quick lookup
  const leadsMap = leads?.reduce((acc, lead) => {
    acc[lead.id] = lead;
    return acc;
  }, {} as Record<string, typeof leads[0]>) || {};

  const filteredWorkouts = workouts?.filter((w) => {
    if (!search) return true;
    const lead = leadsMap[w.lead_id];
    return w.name.toLowerCase().includes(search.toLowerCase()) ||
      lead?.full_name.toLowerCase().includes(search.toLowerCase());
  });

  const activeWorkouts = workouts?.filter(w => w.is_active).length || 0;
  const totalWorkouts = workouts?.length || 0;
  const studentsWithWorkout = new Set(workouts?.map(w => w.lead_id)).size;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Fichas de Treino"
          subtitle="Gerencie as fichas de treino dos alunos"
          icon={<ClipboardList className="h-8 w-8 text-primary" />}
          actions={
            <>
              <Button variant="outline" onClick={() => navigate('/exercises')} className="gap-2">
                <Dumbbell className="h-4 w-4" />
                Banco de Exercícios
              </Button>
              <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Ficha
              </Button>
            </>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Fichas Ativas"
            value={activeWorkouts}
            change={10}
            icon={<ClipboardList className="h-6 w-6 text-primary" />}
            loading={workoutsLoading}
          />
          <StatCard
            title="Alunos com Ficha"
            value={studentsWithWorkout}
            change={5}
            icon={<User className="h-6 w-6 text-primary" />}
            loading={workoutsLoading}
          />
          <StatCard
            title="Total de Fichas"
            value={totalWorkouts}
            change={15}
            icon={<ClipboardList className="h-6 w-6 text-primary" />}
            loading={workoutsLoading}
          />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por aluno ou nome da ficha..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Workouts List */}
        <div className="space-y-2">
          {workoutsLoading ? (
            <>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </>
          ) : filteredWorkouts && filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => {
              const lead = leadsMap[workout.lead_id];
              const initials = lead?.full_name
                ?.split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')
                .toUpperCase() || 'A';

              return (
                <Card
                  key={workout.id}
                  className="border border-border/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">
                          {lead?.full_name || 'Aluno não encontrado'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {workout.name}
                        </p>
                      </div>

                      <div className="hidden md:block text-center min-w-[100px]">
                        <Badge variant="secondary">
                          {workout.workout_exercises?.length || 0} exercícios
                        </Badge>
                      </div>

                      <div className="hidden lg:block text-sm text-muted-foreground min-w-[100px] text-center">
                        {format(new Date(workout.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </div>

                      <Badge variant={workout.is_active ? 'default' : 'outline'} className="min-w-[70px] justify-center">
                        {workout.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>

                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="border border-border/50">
              <CardContent className="py-12 text-center">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhuma ficha encontrada</h3>
                <p className="text-muted-foreground mb-4">
                  {search 
                    ? 'Tente ajustar a busca.'
                    : 'Crie a primeira ficha de treino.'}
                </p>
                {!search && (
                  <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Criar Primeira Ficha
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Create Dialog */}
        <CreateWorkoutDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={(workoutId) => navigate(`/workouts/${workoutId}`)}
        />
      </div>
    </AppLayout>
  );
}
