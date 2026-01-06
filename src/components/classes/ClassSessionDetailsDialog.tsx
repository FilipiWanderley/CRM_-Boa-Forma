import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Clock, 
  MapPin, 
  Users, 
  UserCheck, 
  UserX,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ClassSession, 
  useClassEnrollments, 
  useClassWaitlist,
  useCheckInEnrollment,
  useMarkNoShow,
  useCancelEnrollment
} from '@/hooks/useClasses';

interface ClassSessionDetailsDialogProps {
  session: ClassSession;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnroll?: (sessionId: string) => void;
  isEnrolled?: boolean;
}

export function ClassSessionDetailsDialog({ 
  session, 
  open, 
  onOpenChange,
  onEnroll,
  isEnrolled,
}: ClassSessionDetailsDialogProps) {
  const { data: enrollments, isLoading: enrollmentsLoading } = useClassEnrollments(session.id);
  const { data: waitlist } = useClassWaitlist(session.id);
  const checkIn = useCheckInEnrollment();
  const markNoShow = useMarkNoShow();
  const cancelEnrollment = useCancelEnrollment();

  const spotsLeft = session.max_capacity - session.current_enrollments;
  const isFull = spotsLeft <= 0;
  const occupancyPercent = (session.current_enrollments / session.max_capacity) * 100;

  const activeEnrollments = enrollments?.filter(e => ['enrolled', 'confirmed', 'attended'].includes(e.status)) || [];
  const attendedCount = enrollments?.filter(e => e.status === 'attended').length || 0;

  const statusColors = {
    scheduled: 'bg-blue-500/10 text-blue-600',
    in_progress: 'bg-yellow-500/10 text-yellow-600',
    completed: 'bg-green-500/10 text-green-600',
    cancelled: 'bg-red-500/10 text-red-600',
  };

  const enrollmentStatusColors = {
    enrolled: 'bg-blue-500/10 text-blue-600',
    confirmed: 'bg-green-500/10 text-green-600',
    attended: 'bg-green-500/10 text-green-600',
    no_show: 'bg-red-500/10 text-red-600',
    cancelled: 'bg-gray-500/10 text-gray-600',
  };

  const enrollmentStatusLabels = {
    enrolled: 'Inscrito',
    confirmed: 'Confirmado',
    attended: 'Presente',
    no_show: 'Faltou',
    cancelled: 'Cancelado',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: session.class_type?.color || '#3B82F6' }}
            >
              {session.class_type?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <DialogTitle className="text-xl">{session.class_type?.name || 'Aula'}</DialogTitle>
              <DialogDescription>
                {format(new Date(session.session_date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR })}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            {/* Info Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Clock className="h-4 w-4" />
                  Horário
                </div>
                <div className="font-medium">
                  {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                </div>
              </div>
              
              {session.location && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <MapPin className="h-4 w-4" />
                    Local
                  </div>
                  <div className="font-medium">{session.location}</div>
                </div>
              )}
              
              {session.professor && (
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <UserCheck className="h-4 w-4" />
                    Professor
                  </div>
                  <div className="font-medium">{session.professor.full_name}</div>
                </div>
              )}

              <div className="p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <Users className="h-4 w-4" />
                  Presença
                </div>
                <div className="font-medium">{attendedCount}/{session.current_enrollments}</div>
              </div>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Vagas</span>
                <span className={`text-sm ${isFull ? 'text-destructive' : 'text-green-600'}`}>
                  {session.current_enrollments}/{session.max_capacity}
                </span>
              </div>
              <Progress value={occupancyPercent} className="h-2" />
              {isFull && waitlist && waitlist.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {waitlist.length} pessoa(s) na lista de espera
                </p>
              )}
            </div>

            {/* Enroll Button */}
            {onEnroll && session.status === 'scheduled' && (
              <div>
                {isEnrolled ? (
                  <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    Você está inscrito nesta aula
                  </Badge>
                ) : (
                  <Button onClick={() => onEnroll(session.id)} disabled={isFull}>
                    {isFull ? 'Entrar na Lista de Espera' : 'Inscrever-se'}
                  </Button>
                )}
              </div>
            )}

            <Separator />

            {/* Enrollments List */}
            <div>
              <h4 className="font-semibold mb-3">Inscritos ({activeEnrollments.length})</h4>
              {enrollmentsLoading ? (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              ) : activeEnrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum inscrito ainda</p>
              ) : (
                <div className="space-y-2">
                  {activeEnrollments.map((enrollment) => (
                    <div 
                      key={enrollment.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                          {enrollment.lead?.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="font-medium text-sm">{enrollment.lead?.full_name}</div>
                          <div className="text-xs text-muted-foreground">{enrollment.lead?.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={enrollmentStatusColors[enrollment.status]}>
                          {enrollmentStatusLabels[enrollment.status]}
                        </Badge>
                        {enrollment.status === 'enrolled' && session.status !== 'completed' && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-green-600"
                              onClick={() => checkIn.mutate(enrollment.id)}
                              title="Check-in"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-red-600"
                              onClick={() => markNoShow.mutate(enrollment.id)}
                              title="Marcar falta"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Waitlist */}
            {waitlist && waitlist.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    Lista de Espera ({waitlist.length})
                  </h4>
                  <div className="space-y-2">
                    {waitlist.map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-600 font-medium text-xs">
                            {item.position}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{item.lead?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{item.lead?.phone}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {session.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Observações</h4>
                  <p className="text-sm text-muted-foreground">{session.notes}</p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
