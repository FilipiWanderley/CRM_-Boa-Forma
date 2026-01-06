import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Dumbbell, 
  Trophy, 
  Clock,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { ExerciseExecutionCard } from './ExerciseExecutionCard';
import { useTodayWorkoutLogs, useLogExercise, useRemoveExerciseLog } from '@/hooks/useWorkoutLogs';
import type { Workout } from '@/hooks/useWorkouts';
import { cn } from '@/lib/utils';

interface WorkoutSessionProps {
  workout: Workout;
  leadId: string;
  unitId: string;
  onBack: () => void;
}

export function WorkoutSession({ workout, leadId, unitId, onBack }: WorkoutSessionProps) {
  const [startTime] = useState(new Date());
  const exercises = workout.workout_exercises || [];
  
  const { data: todayLogs = [], isLoading: logsLoading } = useTodayWorkoutLogs(workout.id, leadId);
  const logExercise = useLogExercise();
  const removeLog = useRemoveExerciseLog();

  // Calculate completion
  const completedExerciseIds = new Set(todayLogs.map(log => log.workout_exercise_id));
  const completedCount = exercises.filter(ex => completedExerciseIds.has(ex.id)).length;
  const progressPercentage = exercises.length > 0 ? (completedCount / exercises.length) * 100 : 0;
  const isWorkoutComplete = completedCount === exercises.length && exercises.length > 0;

  // Calculate elapsed time
  const getElapsedTime = () => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    return diff;
  };

  const handleCompleteExercise = async (
    exerciseId: string,
    data: { sets_completed?: number; reps_completed?: string; load_used?: number; notes?: string }
  ) => {
    await logExercise.mutateAsync({
      unit_id: unitId,
      lead_id: leadId,
      workout_id: workout.id,
      workout_exercise_id: exerciseId,
      ...data,
    });
  };

  const handleUncompleteExercise = async (exerciseId: string) => {
    const log = todayLogs.find(l => l.workout_exercise_id === exerciseId);
    if (log) {
      await removeLog.mutateAsync({ 
        logId: log.id, 
        workoutId: workout.id, 
        leadId 
      });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            {workout.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {exercises.length} exercícios
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <Card className={cn(
        'transition-all duration-500',
        isWorkoutComplete && 'bg-success/10 border-success'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{getElapsedTime()} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Flame className="h-4 w-4 text-orange-500" />
                <span>{completedCount}/{exercises.length} exercícios</span>
              </div>
            </div>
            {isWorkoutComplete && (
              <Badge className="bg-success text-success-foreground gap-1">
                <Trophy className="h-3 w-3" />
                Completo!
              </Badge>
            )}
          </div>
          <Progress 
            value={progressPercentage} 
            className={cn(
              'h-2',
              isWorkoutComplete && '[&>div]:bg-success'
            )} 
          />
        </CardContent>
      </Card>

      {/* Completion Celebration */}
      {isWorkoutComplete && (
        <Card className="bg-gradient-to-r from-success/20 to-primary/20 border-success/30">
          <CardContent className="py-6 text-center">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-success" />
            <CardTitle className="text-lg mb-1">Parabéns! 🎉</CardTitle>
            <CardDescription>
              Você completou todos os exercícios do treino de hoje!
            </CardDescription>
            <Button onClick={onBack} className="mt-4">
              Voltar aos Treinos
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Exercise List */}
      <ScrollArea className="h-[calc(100vh-320px)]">
        <div className="space-y-3 pr-4">
          {exercises
            .sort((a, b) => a.order_index - b.order_index)
            .map((exercise, index) => {
              const isCompleted = completedExerciseIds.has(exercise.id);
              const existingLog = todayLogs.find(l => l.workout_exercise_id === exercise.id);

              return (
                <ExerciseExecutionCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isCompleted={isCompleted}
                  existingLog={existingLog}
                  onComplete={(data) => handleCompleteExercise(exercise.id, data)}
                  onUncomplete={() => handleUncompleteExercise(exercise.id)}
                  isLoading={logsLoading || logExercise.isPending || removeLog.isPending}
                />
              );
            })}
        </div>
      </ScrollArea>

      {/* Quick Complete All Button */}
      {!isWorkoutComplete && completedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-10">
          <Badge 
            variant="secondary" 
            className="py-2 px-4 text-sm shadow-lg animate-pulse"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {completedCount} de {exercises.length} concluídos
          </Badge>
        </div>
      )}
    </div>
  );
}
