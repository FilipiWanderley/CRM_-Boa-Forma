import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Clock, 
  MapPin, 
  UserCheck, 
  UserX, 
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ClassSession } from '@/hooks/useClasses';

interface ClassSessionCardProps {
  session: ClassSession;
  onViewDetails?: () => void;
  onEnroll?: () => void;
  showEnrollButton?: boolean;
  isEnrolled?: boolean;
}

export function ClassSessionCard({ 
  session, 
  onViewDetails, 
  onEnroll,
  showEnrollButton = false,
  isEnrolled = false,
}: ClassSessionCardProps) {
  const spotsLeft = session.max_capacity - session.current_enrollments;
  const isFull = spotsLeft <= 0;
  const occupancyPercent = (session.current_enrollments / session.max_capacity) * 100;

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    in_progress: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    completed: 'bg-green-500/10 text-green-600 border-green-500/20',
    cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
  };

  const statusLabels = {
    scheduled: 'Agendada',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: session.class_type?.color || '#3B82F6' }}
            >
              {session.class_type?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <CardTitle className="text-lg">{session.class_type?.name || 'Aula'}</CardTitle>
              <CardDescription className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[session.status]}>
            {statusLabels[session.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Info Row */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {session.professor && (
            <div className="flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              {session.professor.full_name}
            </div>
          )}
          {session.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {session.location}
            </div>
          )}
        </div>

        {/* Capacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {session.current_enrollments}/{session.max_capacity} vagas
              </span>
            </div>
            {isFull ? (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Lotada
              </span>
            ) : (
              <span className="text-green-600">{spotsLeft} vagas restantes</span>
            )}
          </div>
          <Progress value={occupancyPercent} className="h-2" />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          {showEnrollButton && session.status === 'scheduled' && (
            <>
              {isEnrolled ? (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserCheck className="h-3 w-3" />
                  Inscrito
                </Badge>
              ) : (
                <Button 
                  size="sm" 
                  onClick={onEnroll}
                  disabled={isFull}
                  variant={isFull ? 'outline' : 'default'}
                >
                  {isFull ? 'Entrar na Lista de Espera' : 'Inscrever-se'}
                </Button>
              )}
            </>
          )}
          {onViewDetails && (
            <Button size="sm" variant="ghost" onClick={onViewDetails} className="ml-auto">
              Detalhes
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
