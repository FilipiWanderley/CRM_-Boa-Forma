import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Clock, 
  Repeat, 
  Weight,
  Video,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkoutExercise } from '@/hooks/useWorkouts';
import type { WorkoutLog } from '@/hooks/useWorkoutLogs';
import { RestTimer, InlineRestTimer } from './RestTimer';

interface ExerciseExecutionCardProps {
  exercise: WorkoutExercise;
  index: number;
  isCompleted: boolean;
  existingLog?: WorkoutLog;
  onComplete: (data: { 
    sets_completed?: number; 
    reps_completed?: string; 
    load_used?: number;
    notes?: string;
  }) => Promise<void>;
  onUncomplete: () => Promise<void>;
  isLoading?: boolean;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function ExerciseExecutionCard({
  exercise,
  index,
  isCompleted,
  existingLog,
  onComplete,
  onUncomplete,
  isLoading = false,
}: ExerciseExecutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [loadUsed, setLoadUsed] = useState<string>(
    existingLog?.load_used?.toString() || exercise.load_value?.toString() || ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasVideo = exercise.exercise?.video_url;
  const hasImage = exercise.exercise?.image_url;
  const videoId = hasVideo ? getYouTubeVideoId(exercise.exercise!.video_url!) : null;

  const handleToggleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (isCompleted) {
        await onUncomplete();
      } else {
        await onComplete({
          sets_completed: exercise.sets,
          reps_completed: exercise.reps,
          load_used: loadUsed ? parseFloat(loadUsed) : undefined,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Card 
        className={cn(
          'transition-all duration-300 overflow-hidden',
          isCompleted 
            ? 'bg-success/10 border-success/30' 
            : 'hover:border-primary/30'
        )}
      >
        <CardContent className="p-0">
          {/* Main Row */}
          <div className="flex items-center gap-3 p-4">
            {/* Completion Button */}
            <button
              onClick={handleToggleComplete}
              disabled={isSubmitting || isLoading}
              className={cn(
                'flex-shrink-0 transition-all duration-200',
                isCompleted ? 'text-success scale-110' : 'text-muted-foreground hover:text-primary'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <Circle className="h-7 w-7" />
              )}
            </button>

            {/* Exercise Info */}
            <div 
              className="flex-1 min-w-0 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">
                  {index + 1}.
                </span>
                <p className={cn(
                  'font-medium truncate',
                  isCompleted && 'line-through text-muted-foreground'
                )}>
                  {exercise.exercise_name}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  {exercise.sets} x {exercise.reps}
                </span>
                {exercise.rest_seconds && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {exercise.rest_seconds}s
                  </span>
                )}
                {exercise.load_value && (
                  <span className="flex items-center gap-1">
                    <Weight className="h-3 w-3" />
                    {exercise.load_value}{exercise.load_unit || 'kg'}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Rest Timer Button */}
              {exercise.rest_seconds && !isCompleted && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTimer(!showTimer);
                  }}
                >
                  <Timer className="h-4 w-4" />
                </Button>
              )}
              {hasVideo && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowVideo(true);
                  }}
                >
                  <Play className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Rest Timer (shown when active) */}
          {showTimer && exercise.rest_seconds && (
            <div className="px-4 pb-4">
              <RestTimer
                initialSeconds={exercise.rest_seconds}
                onClose={() => setShowTimer(false)}
                autoStart={true}
              />
            </div>
          )}

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-4 pb-4 pt-0 border-t border-border/50 space-y-4">
              {/* Image/GIF Preview */}
              {hasImage && (
                <div className="relative rounded-lg overflow-hidden bg-secondary/50">
                  <img
                    src={exercise.exercise!.image_url!}
                    alt={exercise.exercise_name}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              {/* Advanced Technique Badge */}
              {exercise.advanced_technique && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="h-3 w-3" />
                  {exercise.advanced_technique.replace('_', ' ').toUpperCase()}
                </Badge>
              )}

              {/* Load Input */}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-sm text-muted-foreground mb-1 block">
                    Carga utilizada ({exercise.load_unit || 'kg'})
                  </label>
                  <Input
                    type="number"
                    placeholder="Ex: 20"
                    value={loadUsed}
                    onChange={(e) => setLoadUsed(e.target.value)}
                    className="h-10"
                  />
                </div>
                <Button
                  onClick={handleToggleComplete}
                  disabled={isSubmitting || isLoading}
                  variant={isCompleted ? 'secondary' : 'default'}
                  className="mt-5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : null}
                  {isCompleted ? 'Concluído' : 'Marcar Feito'}
                </Button>
              </div>

              {/* Notes */}
              {exercise.notes && (
                <div className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  💡 <span className="italic">{exercise.notes}</span>
                </div>
              )}

              {/* Logged Info */}
              {existingLog && (
                <div className="text-xs text-success flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Registrado às {new Date(existingLog.completed_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                  {existingLog.load_used && ` • ${existingLog.load_used}${exercise.load_unit || 'kg'}`}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Video Dialog */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {exercise.exercise_name}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {videoId ? (
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : hasVideo ? (
              <video
                src={exercise.exercise!.video_url!}
                className="w-full h-full"
                controls
                autoPlay
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-secondary">
                <p className="text-muted-foreground">Vídeo não disponível</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
