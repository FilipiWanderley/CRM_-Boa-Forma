import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { type Appointment } from '@/hooks/useScheduling';
import { cn } from '@/lib/utils';

interface MonthlyCalendarProps {
  appointments: Appointment[];
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function MonthlyCalendar({ appointments, onDateSelect, selectedDate }: MonthlyCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    
    const daysArray = [];
    let day = start;
    
    while (day <= end) {
      daysArray.push(day);
      day = addDays(day, 1);
    }
    
    return daysArray;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    onDateSelect(new Date());
  };

  const getAppointmentsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return appointments.filter(a => a.scheduled_date === dateStr);
  };

  const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  return (
    <div className="border rounded-lg bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hoje
          </Button>
        </div>
        <h3 className="font-semibold text-lg">
          {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
        </h3>
        <div className="w-[120px]" />
      </div>

      {/* Week Days Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, selectedDate);
          const dayAppointments = getAppointmentsForDay(day);
          const pendingCount = dayAppointments.filter(a => ['scheduled', 'confirmed'].includes(a.status)).length;

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'min-h-[80px] p-2 border-b border-r transition-colors hover:bg-secondary text-left',
                !isCurrentMonth && 'bg-muted/30 text-muted-foreground',
                isSelected && 'bg-primary/10 ring-1 ring-primary',
                isToday && 'font-bold'
              )}
            >
              <div className="flex items-start justify-between">
                <span className={cn(
                  'text-sm',
                  isToday && 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                )}>
                  {format(day, 'd')}
                </span>
                {pendingCount > 0 && (
                  <Badge variant="default" className="text-xs">
                    {pendingCount}
                  </Badge>
                )}
              </div>
              
              {/* Show first 2 appointments */}
              <div className="mt-1 space-y-0.5">
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    className={cn(
                      'text-xs px-1 rounded truncate',
                      apt.status === 'cancelled' ? 'bg-muted text-muted-foreground line-through' :
                      apt.status === 'completed' ? 'bg-primary/20 text-primary' :
                      'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                    )}
                  >
                    {apt.start_time.slice(0, 5)} {apt.title}
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{dayAppointments.length - 2} mais
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
