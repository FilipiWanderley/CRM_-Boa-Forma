import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Dumbbell, 
  Clock, 
  Repeat, 
  Play, 
  Video,
  PlayCircle,
  CheckCircle2,
  Target,
  ChevronRight,
  Flame
} from 'lucide-react';
import { useTodayWorkoutLogs } from '@/hooks/useWorkoutLogs';
import type { Workout } from '@/hooks/useWorkouts';

interface WorkoutCardProps {
  workout: Workout;
  leadId?: string;
  unitId?: string;
  onStartSession?: (workout: Workout) => void;
}

// Workout images based on workout name/type
const workoutImages: Record<string, string> = {
  'peito': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&auto=format&fit=crop&q=60',
  'costas': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?w=800&auto=format&fit=crop&q=60',
  'perna': 'https://images.unsplash.com/photo-1434608519344-49d77a699e1d?w=800&auto=format&fit=crop&q=60',
  'ombro': 'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=800&auto=format&fit=crop&q=60',
  'braço': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60',
  'cardio': 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=800&auto=format&fit=crop&q=60',
  'default': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=60',
};

function getWorkoutImage(workoutName: string): string {
  const nameLower = workoutName.toLowerCase();
  for (const [key, url] of Object.entries(workoutImages)) {
    if (nameLower.includes(key)) return url;
  }
  return workoutImages.default;
}

// Extract YouTube video ID from various URL formats
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

export function WorkoutCard({ workout, leadId, unitId, onStartSession }: WorkoutCardProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const exercises = workout.workout_exercises || [];

  // Get today's logs for this workout
  const { data: todayLogs = [] } = useTodayWorkoutLogs(workout.id, leadId);
  const completedExerciseIds = new Set(todayLogs.map(log => log.workout_exercise_id));
  const completedCount = exercises.filter(ex => completedExerciseIds.has(ex.id)).length;
  const progressPercentage = exercises.length > 0 ? Math.round((completedCount / exercises.length) * 100) : 0;

  const handlePlayVideo = (url: string, title: string) => {
    setVideoUrl(url);
    setVideoTitle(title);
  };

  const videoId = videoUrl ? getYouTubeVideoId(videoUrl) : null;
  const workoutImage = getWorkoutImage(workout.name);

  return (
    <>
      <Card className="card-fitness overflow-hidden">
        {/* Image Header */}
        <div className="relative h-36">
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${workoutImage}')` }}
          />
          <div className="workout-card-overlay" />
          
          {/* Progress overlay if started */}
          {completedCount > 0 && (
            <div className="absolute top-3 left-3 right-3">
              <div className="h-1.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="absolute inset-0 p-4 flex flex-col justify-between">
            {/* Top badges */}
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-2">
                {progressPercentage === 100 && (
                  <Badge className="bg-success/90 text-white border-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completo!
                  </Badge>
                )}
                {completedCount > 0 && completedCount < exercises.length && (
                  <Badge className="bg-amber/90 text-white border-0">
                    <Flame className="h-3 w-3 mr-1" />
                    {completedCount}/{exercises.length} feitos
                  </Badge>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className="bg-black/50 text-white border-0 backdrop-blur-sm"
              >
                {workout.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
            
            {/* Bottom info */}
            <div>
              <h3 className="text-white font-display text-xl font-bold">
                {workout.name}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-white/80 text-sm">
                <span className="flex items-center gap-1">
                  <Target className="h-3.5 w-3.5" />
                  {exercises.length} exercícios
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  ~{exercises.length * 5} min
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Exercise Preview */}
        <CardContent className="p-4 space-y-4">
          {workout.description && (
            <p className="text-sm text-muted-foreground">
              {workout.description}
            </p>
          )}

          {/* Exercise List Preview */}
          {exercises.length > 0 && (
            <div className="space-y-2">
              {exercises.slice(0, 3).map((exercise, index) => {
                const isCompleted = completedExerciseIds.has(exercise.id);
                const hasVideo = exercise.exercise?.video_url;
                
                return (
                  <div 
                    key={exercise.id}
                    className={`flex items-center gap-3 p-2 rounded-xl transition-colors ${
                      isCompleted ? 'bg-success/10' : 'bg-secondary/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isCompleted 
                        ? 'bg-success text-white' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm truncate ${
                        isCompleted ? 'line-through text-muted-foreground' : ''
                      }`}>
                        {exercise.exercise_name}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{exercise.sets}x{exercise.reps}</span>
                        {exercise.rest_seconds && (
                          <span>• {exercise.rest_seconds}s</span>
                        )}
                      </p>
                    </div>
                    {hasVideo && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayVideo(exercise.exercise!.video_url!, exercise.exercise_name);
                        }}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
              
              {exercises.length > 3 && (
                <p className="text-xs text-muted-foreground text-center py-1">
                  +{exercises.length - 3} mais exercícios
                </p>
              )}
            </div>
          )}

          {/* Start Button */}
          {onStartSession && (
            <Button 
              onClick={() => onStartSession(workout)}
              className="w-full gap-2 rounded-xl h-12"
              size="lg"
            >
              <PlayCircle className="h-5 w-5" />
              {completedCount > 0 ? 'Continuar Treino' : 'Iniciar Treino'}
              <ChevronRight className="h-4 w-4 ml-auto" />
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Video Dialog */}
      <Dialog open={!!videoUrl} onOpenChange={(open) => !open && setVideoUrl(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {videoTitle}
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