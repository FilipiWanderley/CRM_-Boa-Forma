import { useState, useMemo } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Appointment, appointmentStatusLabels } from '@/hooks/useScheduling';
import { cn } from '@/lib/utils';

interface WeeklyCalendarProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

const timeSlots = Array.from({ length: 14 }, (_, i) => {
  const hour = 6 + i;
  return `${hour.toString().padStart(2, '0')}:00`;
});

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/80 hover:bg-blue-500',
  confirmed: 'bg-success/80 hover:bg-success',
  completed: 'bg-primary/80 hover:bg-primary',
  cancelled: 'bg-muted hover:bg-muted',
  no_show: 'bg-destructive/80 hover:bg-destructive',
};

export function WeeklyCalendar({ appointments, onDateSelect, selectedDate }: WeeklyCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const goToPreviousWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const goToNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const goToToday = () => {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
    onDateSelect(new Date());
  };

  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return appointments.filter(a => a.scheduled_date === dateStr);
  };

  const getAppointmentPosition = (appointment: Appointment) => {
    const [startHour, startMin] = appointment.start_time.split(':').map(Number);
    const [endHour, endMin] = appointment.end_time.split(':').map(Number);
    
    const top = ((startHour - 6) * 60 + startMin) * (48 / 60); // 48px per hour
    const height = ((endHour - startHour) * 60 + (endMin - startMin)) * (48 / 60);
    
    return { top: Math.max(0, top), height: Math.max(24, height) };
  };

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <h3 className="font-semibold">
          {format(weekStart, "MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        <div className="w-[120px]" /> {/* Spacer */}
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 text-center text-sm text-muted-foreground border-r">
          Hora
        </div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const dayAppointments = getAppointmentsForDay(day);
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'p-2 text-center transition-colors hover:bg-secondary',
                isSelected && 'bg-primary/10',
                isToday && 'font-bold'
              )}
            >
              <p className="text-xs text-muted-foreground">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className={cn(
                'text-lg',
                isToday && 'text-primary'
              )}>
                {format(day, 'd')}
              </p>
              {dayAppointments.length > 0 && (
                <Badge variant="secondary" className="text-xs mt-1">
                  {dayAppointments.length}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      {/* Time Grid */}
      <ScrollArea className="h-[500px]">
        <div className="grid grid-cols-8">
          {/* Time Column */}
          <div className="border-r">
            {timeSlots.map((time) => (
              <div key={time} className="h-12 border-b px-2 text-xs text-muted-foreground flex items-start pt-1">
                {time}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            
            return (
              <div key={day.toISOString()} className="relative border-r last:border-r-0">
                {timeSlots.map((time) => (
                  <div key={time} className="h-12 border-b" />
                ))}
                
                {/* Appointments */}
                {dayAppointments.map((appointment) => {
                  const { top, height } = getAppointmentPosition(appointment);
                  
                  return (
                    <div
                      key={appointment.id}
                      className={cn(
                        'absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-xs text-white overflow-hidden cursor-pointer transition-colors',
                        statusColors[appointment.status]
                      )}
                      style={{ top: `${top}px`, height: `${height}px` }}
                      title={`${appointment.title} - ${appointment.start_time.slice(0, 5)}`}
                    >
                      <p className="font-medium truncate">{appointment.title}</p>
                      {height > 30 && (
                        <p className="truncate opacity-80">
                          {appointment.start_time.slice(0, 5)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
