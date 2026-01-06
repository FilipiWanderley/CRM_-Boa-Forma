import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  ArrowLeft, 
  Plus, 
  ClipboardList, 
  User, 
  Trash2,
  GripVertical,
  Clock,
  Repeat,
  Play
} from 'lucide-react';
import { useWorkouts, useDeleteWorkoutExercise, type WorkoutExercise } from '@/hooks/useWorkouts';
import { useLead } from '@/hooks/useLeads';
import { AddExerciseToWorkoutDialog } from '@/components/workouts/AddExerciseToWorkoutDialog';

export default function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [addExerciseOpen, setAddExerciseOpen] = useState(false);
  const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);
  
  const { data: workouts, isLoading } = useWorkouts();
  const deleteExercise = useDeleteWorkoutExercise();
  
  const workout = workouts?.find(w => w.id === id);
  const { data: lead } = useLead(workout?.lead_id || '');

  const exercises = workout?.workout_exercises?.sort((a, b) => a.order_index - b.order_index) || [];

  const handleDeleteExercise = async () => {
    if (deleteExerciseId) {
      await deleteExercise.mutateAsync(deleteExerciseId);
      setDeleteExerciseId(null);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-60 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!workout) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Ficha não encontrada</h2>
          <Button onClick={() => navigate('/workouts')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Fichas
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/workouts')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">
                {workout.name}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {lead?.full_name || 'Carregando...'}
                </span>
                <Badge variant={workout.is_active ? 'default' : 'outline'}>
                  {workout.is_active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
            </div>
          </div>
          <Button onClick={() => setAddExerciseOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Exercício
          </Button>
        </div>

        {/* Workout Info */}
        {workout.description && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">{workout.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Exercises List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Exercícios
              <Badge variant="secondary">{exercises.length}</Badge>
            </CardTitle>
            <CardDescription>
              Arraste para reordenar os exercícios (em breve)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {exercises.length > 0 ? (
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 group"
                  >
                    {/* Drag Handle */}
                    <div className="text-muted-foreground cursor-grab">
                      <GripVertical className="h-5 w-5" />
                    </div>

                    {/* Order Number */}
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    </div>

                    {/* Exercise Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium">{exercise.exercise_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Repeat className="h-3 w-3" />
                          {exercise.sets} x {exercise.reps}
                        </span>
                        {exercise.rest_seconds && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {exercise.rest_seconds}s descanso
                          </span>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          {exercise.notes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                      onClick={() => setDeleteExerciseId(exercise.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="font-semibold mb-2">Nenhum exercício na ficha</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione exercícios para completar esta ficha de treino.
                </p>
                <Button onClick={() => setAddExerciseOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Primeiro Exercício
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Exercise Dialog */}
        <AddExerciseToWorkoutDialog
          open={addExerciseOpen}
          onOpenChange={setAddExerciseOpen}
          workoutId={workout.id}
          currentExercisesCount={exercises.length}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteExerciseId} onOpenChange={() => setDeleteExerciseId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Exercício</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover este exercício da ficha? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteExercise}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
