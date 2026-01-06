import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader, StatCard } from '@/components/shared';
import { Plus, Search, Dumbbell, Filter, Video } from 'lucide-react';
import { useExercises, muscleGroups, type Exercise } from '@/hooks/useExercises';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { CreateExerciseDialog } from '@/components/exercises/CreateExerciseDialog';

export default function Exercises() {
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editExercise, setEditExercise] = useState<Exercise | null>(null);
  
  const { data: exercises, isLoading } = useExercises();

  const filteredExercises = exercises?.filter((e) => {
    const matchesSearch = !search || 
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !selectedMuscle || e.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  // Group by muscle
  const groupedExercises = filteredExercises?.reduce((acc, exercise) => {
    const group = exercise.muscle_group || 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(exercise);
    return acc;
  }, {} as Record<string, Exercise[]>);

  const handleEdit = (exercise: Exercise) => {
    setEditExercise(exercise);
    setCreateDialogOpen(true);
  };

  const totalExercises = exercises?.length || 0;
  const withVideo = exercises?.filter(e => e.video_url).length || 0;
  const muscleGroupsCount = new Set(exercises?.map(e => e.muscle_group).filter(Boolean)).size;

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Banco de Exercícios"
          subtitle="Gerencie os exercícios disponíveis para prescrição"
          icon={<Dumbbell className="h-8 w-8 text-primary" />}
          actions={
            <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Exercício
            </Button>
          }
        />

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total de Exercícios"
            value={totalExercises}
            change={8}
            icon={<Dumbbell className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Com Vídeo"
            value={withVideo}
            change={12}
            icon={<Video className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
          <StatCard
            title="Grupos Musculares"
            value={muscleGroupsCount}
            icon={<Filter className="h-6 w-6 text-primary" />}
            loading={isLoading}
          />
        </div>

        {/* Search and Filter */}
        <Card className="border border-border/50">
          <CardContent className="pt-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Muscle Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedMuscle === null ? 'default' : 'outline'}
                className="cursor-pointer hover:bg-primary/90"
                onClick={() => setSelectedMuscle(null)}
              >
                Todos
              </Badge>
              {muscleGroups.map((group) => (
                <Badge
                  key={group}
                  variant={selectedMuscle === group ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSelectedMuscle(group)}
                >
                  {group}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercise List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredExercises && filteredExercises.length > 0 ? (
          selectedMuscle ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExercises.map((exercise) => (
                <ExerciseCard 
                  key={exercise.id} 
                  exercise={exercise}
                  onEdit={handleEdit}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedExercises || {}).map(([group, groupExercises]) => (
                <div key={group}>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Dumbbell className="h-5 w-5 text-primary" />
                    </div>
                    {group}
                    <Badge variant="secondary">{groupExercises.length}</Badge>
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groupExercises.map((exercise) => (
                      <ExerciseCard 
                        key={exercise.id} 
                        exercise={exercise}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <Card className="border border-border/50">
            <CardContent className="py-12 text-center">
              <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">Nenhum exercício encontrado</CardTitle>
              <CardDescription className="mb-4">
                {search || selectedMuscle 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece criando seu banco de exercícios.'}
              </CardDescription>
              {!search && !selectedMuscle && (
                <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Primeiro Exercício
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <CreateExerciseDialog
          open={createDialogOpen}
          onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) setEditExercise(null);
          }}
          editExercise={editExercise}
        />
      </div>
    </AppLayout>
  );
}
