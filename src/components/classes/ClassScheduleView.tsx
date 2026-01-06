import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Users, Plus } from 'lucide-react';
import { useClassSessions, ClassSession } from '@/hooks/useClasses';
import { ClassSessionCard } from './ClassSessionCard';
import { ClassSessionDetailsDialog } from './ClassSessionDetailsDialog';
import { CreateClassSessionDialog } from './CreateClassSessionDialog';

interface ClassScheduleViewProps {
  unitId: string;
  onEnroll?: (sessionId: string) => void;
  showEnrollButton?: boolean;
  myEnrollments?: string[];
}

export function ClassScheduleView({ 
  unitId, 
  onEnroll,
  showEnrollButton = false,
  myEnrollments = [],
}: ClassScheduleViewProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);
  
  const { data: sessions, isLoading } = useClassSessions(
    format(weekStart, 'yyyy-MM-dd'),
    format(weekEnd, 'yyyy-MM-dd')
  );

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getSessionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions?.filter(s => s.session_date === dateStr) || [];
  };

  const handlePrevWeek = () => setWeekStart(addDays(weekStart, -7));
  const handleNextWeek = () => setWeekStart(addDays(weekStart, 7));
  const handleToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleCreateSession = (date: Date) => {
    setSelectedDate(date);
    setCreateSessionOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={handleToday}>
            Hoje
          </Button>
        </div>
        <h3 className="text-lg font-semibold">
          {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(weekEnd, "d 'de' MMMM", { locale: ptBR })}
        </h3>
        <Button onClick={() => setCreateSessionOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Aula
        </Button>
      </div>

      {/* Week Grid */}
      {isLoading ? (
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => {
            const daySessions = getSessionsForDay(day);
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card 
                key={day.toISOString()} 
                className={`min-h-[200px] ${isToday ? 'ring-2 ring-primary' : ''}`}
              >
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className={isToday ? 'text-primary font-bold' : ''}>
                      {format(day, 'EEE', { locale: ptBR })}
                    </span>
                    <span className={`text-lg ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                      {format(day, 'd')}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-2 pb-2 space-y-1">
                  {daySessions.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-muted-foreground mb-2">Sem aulas</p>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => handleCreateSession(day)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSession(session)}
                        className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
                        style={{ borderLeft: `3px solid ${session.class_type?.color || '#3B82F6'}` }}
                      >
                        <div className="font-medium text-xs truncate">
                          {session.class_type?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.start_time.slice(0, 5)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <Users className="h-3 w-3" />
                          {session.current_enrollments}/{session.max_capacity}
                        </div>
                        {myEnrollments.includes(session.id) && (
                          <Badge variant="secondary" className="text-[10px] mt-1">
                            Inscrito
                          </Badge>
                        )}
                      </button>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Session Details Dialog */}
      {selectedSession && (
        <ClassSessionDetailsDialog
          session={selectedSession}
          open={!!selectedSession}
          onOpenChange={(open) => !open && setSelectedSession(null)}
          onEnroll={showEnrollButton ? onEnroll : undefined}
          isEnrolled={myEnrollments.includes(selectedSession.id)}
        />
      )}

      {/* Create Session Dialog */}
      <CreateClassSessionDialog
        open={createSessionOpen}
        onOpenChange={setCreateSessionOpen}
        unitId={unitId}
        preSelectedDate={selectedDate || undefined}
      />
    </div>
  );
}
