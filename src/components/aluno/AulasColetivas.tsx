import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { format, addDays, isSameDay, parseISO, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  User,
  X
} from 'lucide-react';
import { 
  useClassSessions, 
  useMyEnrollments, 
  useEnrollInClass, 
  useCancelEnrollment,
  type ClassSession 
} from '@/hooks/useClasses';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AulasColetinasProps {
  leadId?: string;
  unitId?: string;
}

export function AulasColetivas({ leadId, unitId }: AulasColetinasProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(() => {
    const today = new Date();
    const day = today.getDay();
    return addDays(today, -day);
  });
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Get sessions for the week
  const startDate = format(weekStart, 'yyyy-MM-dd');
  const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  
  const { data: sessions, isLoading } = useClassSessions(startDate, endDate);
  const { data: myEnrollments } = useMyEnrollments();
  const enrollMutation = useEnrollInClass();
  const cancelMutation = useCancelEnrollment();

  // Filter sessions for selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const sessionsForDate = sessions?.filter(s => s.session_date === selectedDateStr && s.status === 'scheduled') || [];

  // Check if user is enrolled in a session
  const isEnrolled = (sessionId: string) => {
    return myEnrollments?.some(e => e.class_session_id === sessionId && ['enrolled', 'confirmed'].includes(e.status));
  };

  const getEnrollment = (sessionId: string) => {
    return myEnrollments?.find(e => e.class_session_id === sessionId && ['enrolled', 'confirmed'].includes(e.status));
  };

  // Navigate weeks
  const goToPreviousWeek = () => setWeekStart(prev => addDays(prev, -7));
  const goToNextWeek = () => setWeekStart(prev => addDays(prev, 7));

  // Generate week days
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get session count for a day
  const getSessionCount = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions?.filter(s => s.session_date === dateStr && s.status === 'scheduled').length || 0;
  };

  // Handle enrollment
  const handleEnroll = async () => {
    if (!selectedSession || !leadId || !unitId) {
      toast({
        title: 'Erro',
        description: 'Não foi possível realizar a inscrição.',
        variant: 'destructive'
      });
      return;
    }

    enrollMutation.mutate(
      { sessionId: selectedSession.id, leadId, unitId },
      {
        onSuccess: () => {
          setShowConfirmDialog(false);
          setSelectedSession(null);
        }
      }
    );
  };

  // Handle cancel enrollment
  const handleCancelEnrollment = async () => {
    if (!selectedSession) return;
    
    const enrollment = getEnrollment(selectedSession.id);
    if (!enrollment) return;

    cancelMutation.mutate(
      { id: enrollment.id },
      {
        onSuccess: () => {
          setShowCancelDialog(false);
          setSelectedSession(null);
        }
      }
    );
  };

  // Get availability info
  const getAvailabilityInfo = (session: ClassSession) => {
    const available = session.max_capacity - (session.current_enrollments || 0);
    const percentage = (available / session.max_capacity) * 100;
    
    if (available <= 0) return { text: 'Lotada', color: 'text-destructive', bgColor: 'bg-destructive/10' };
    if (percentage <= 20) return { text: `${available} vagas`, color: 'text-amber', bgColor: 'bg-amber/10' };
    return { text: `${available} vagas`, color: 'text-success', bgColor: 'bg-success/10' };
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div>
        <h2 className="font-display text-xl font-bold text-foreground">Aulas Coletivas</h2>
        <p className="text-muted-foreground text-sm">Escolha uma aula e faça sua inscrição</p>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <span className="font-medium text-foreground">
          {format(weekStart, "dd 'de' MMM", { locale: ptBR })} - {format(addDays(weekStart, 6), "dd 'de' MMM", { locale: ptBR })}
        </span>
        <Button variant="ghost" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Week Days Selector */}
      <div className="grid grid-cols-7 gap-1">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isToday = isSameDay(day, new Date());
          const sessionCount = getSessionCount(day);
          const isPast = !isAfter(day, addDays(new Date(), -1));
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              disabled={isPast}
              className={cn(
                "flex flex-col items-center py-2 px-1 rounded-xl transition-all",
                isSelected 
                  ? "bg-primary text-primary-foreground" 
                  : isToday 
                    ? "bg-primary/20 text-primary"
                    : isPast
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <span className="text-[10px] uppercase font-medium">
                {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
              </span>
              <span className="text-lg font-bold">
                {format(day, 'd')}
              </span>
              {sessionCount > 0 && (
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-1",
                  isSelected ? "bg-primary-foreground" : "bg-primary"
                )} />
              )}
            </button>
          );
        })}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground">
          {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : sessionsForDate.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhuma aula disponível neste dia</p>
            </CardContent>
          </Card>
        ) : (
          sessionsForDate.map((session) => {
            const enrolled = isEnrolled(session.id);
            const availability = getAvailabilityInfo(session);
            const classColor = session.class_type?.color || '#6366f1';
            
            return (
              <Card 
                key={session.id}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all hover:shadow-md",
                  enrolled && "ring-2 ring-primary"
                )}
                onClick={() => {
                  setSelectedSession(session);
                  if (enrolled) {
                    setShowCancelDialog(true);
                  } else {
                    setShowConfirmDialog(true);
                  }
                }}
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Color bar */}
                    <div 
                      className="w-2 flex-shrink-0"
                      style={{ backgroundColor: classColor }}
                    />
                    
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-foreground">
                              {session.class_type?.name}
                            </h4>
                            {enrolled && (
                              <Badge className="bg-primary/20 text-primary text-xs">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Inscrito
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}
                            </div>
                            {session.professor?.full_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {session.professor.full_name}
                              </div>
                            )}
                            {session.location && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" />
                                {session.location}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                          availability.bgColor,
                          availability.color
                        )}>
                          <Users className="h-3.5 w-3.5" />
                          {availability.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* My Enrollments Summary */}
      {myEnrollments && myEnrollments.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Minhas Inscrições
          </h3>
          
          <div className="space-y-2">
            {myEnrollments.slice(0, 3).map((enrollment) => {
              const session = enrollment.class_session;
              if (!session) return null;
              
              return (
                <Card key={enrollment.id} className="bg-secondary/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">
                          {session.class_type?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(session.session_date), "EEE, dd/MM", { locale: ptBR })} às {session.start_time.slice(0, 5)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSession(session);
                          setShowCancelDialog(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Enrollment Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Inscrição</DialogTitle>
            <DialogDescription>
              Você deseja se inscrever nesta aula?
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="py-4">
              <Card className="bg-secondary/50">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-lg">
                    {selectedSession.class_type?.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(selectedSession.session_date), "dd/MM/yyyy")}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {selectedSession.start_time.slice(0, 5)} - {selectedSession.end_time.slice(0, 5)}
                    </div>
                    {selectedSession.professor?.full_name && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="h-4 w-4" />
                        {selectedSession.professor.full_name}
                      </div>
                    )}
                    {selectedSession.location && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {selectedSession.location}
                      </div>
                    )}
                  </div>
                  
                  {selectedSession.current_enrollments >= selectedSession.max_capacity && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-amber/10 text-amber mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">Aula lotada. Você será adicionado à lista de espera.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEnroll} 
              disabled={enrollMutation.isPending || !leadId}
            >
              {enrollMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Enrollment Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar Inscrição</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua inscrição nesta aula?
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="py-4">
              <Card className="bg-secondary/50">
                <CardContent className="p-4 space-y-2">
                  <h4 className="font-bold text-lg">
                    {selectedSession.class_type?.name}
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {format(parseISO(selectedSession.session_date), "dd/MM/yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {selectedSession.start_time.slice(0, 5)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Voltar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleCancelEnrollment} 
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cancelar Inscrição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
