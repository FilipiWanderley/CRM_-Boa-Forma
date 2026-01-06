import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { MoreVertical, Trash2, Edit, Play, Dumbbell, ExternalLink } from 'lucide-react';
import type { Exercise } from '@/hooks/useExercises';
import { useDeleteExercise } from '@/hooks/useExercises';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onSelect?: (exercise: Exercise) => void;
  selectable?: boolean;
}

export function ExerciseCard({ exercise, onEdit, onSelect, selectable }: ExerciseCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const deleteExercise = useDeleteExercise();

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir este exercício?')) {
      deleteExercise.mutate(exercise.id);
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : null;
  };

  return (
    <>
      <Card 
        className={`card-glow transition-all ${selectable ? 'cursor-pointer hover:border-primary' : ''}`}
        onClick={() => selectable && onSelect?.(exercise)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Thumbnail */}
            <div className="relative h-16 w-16 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {exercise.image_url ? (
                <img 
                  src={exercise.image_url} 
                  alt={exercise.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Dumbbell className="h-6 w-6 text-muted-foreground" />
              )}
              {exercise.video_url && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowVideo(true); }}
                  className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                >
                  <Play className="h-6 w-6 text-white" fill="white" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-sm truncate">{exercise.name}</h4>
                  {exercise.muscle_group && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {exercise.muscle_group}
                    </Badge>
                  )}
                </div>
                
                {!selectable && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {exercise.video_url && (
                        <DropdownMenuItem onClick={() => setShowVideo(true)}>
                          <Play className="h-4 w-4 mr-2" />
                          Ver Vídeo
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit?.(exercise)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleDelete}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {exercise.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {exercise.description}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Dialog */}
      <Dialog open={showVideo} onOpenChange={setShowVideo}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              {exercise.name}
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video w-full">
            {exercise.video_url && getYouTubeEmbedUrl(exercise.video_url) ? (
              <iframe
                src={getYouTubeEmbedUrl(exercise.video_url)!}
                className="w-full h-full rounded-lg"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : exercise.video_url ? (
              <div className="w-full h-full flex items-center justify-center bg-secondary rounded-lg">
                <a 
                  href={exercise.video_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-primary hover:underline"
                >
                  <ExternalLink className="h-5 w-5" />
                  Abrir vídeo em nova aba
                </a>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
