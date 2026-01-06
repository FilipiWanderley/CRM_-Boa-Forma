import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppLayout } from '@/components/layout/AppLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useAppointmentsByRange, useAppointmentStats } from '@/hooks/useScheduling';
import { useClassStats } from '@/hooks/useClasses';
import { CreateAppointmentDialog } from '@/components/scheduling/CreateAppointmentDialog';
import { AppointmentCard } from '@/components/scheduling/AppointmentCard';
import { WeeklyCalendar } from '@/components/scheduling/WeeklyCalendar';
import { MonthlyCalendar } from '@/components/scheduling/MonthlyCalendar';
import { ProfessorAvailabilityManager } from '@/components/scheduling/ProfessorAvailabilityManager';
import { ScheduleBlockManager } from '@/components/scheduling/ScheduleBlockManager';
import { ClassTypesManager } from '@/components/classes/ClassTypesManager';
import { ClassScheduleView } from '@/components/classes/ClassScheduleView';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  CalendarDays,
  CalendarRange,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCog,
  Ban,
  Users,
  Dumbbell
} from 'lucide-react';

export default function Scheduling() {
  const { profile, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('calendar');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const isGestor = hasRole('gestor');
  const isProfessor = hasRole('professor');

  // Calculate date range for fetching
  const dateRange = useMemo(() => {
    if (view === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      const start = startOfWeek(monthStart, { weekStartsOn: 1 });
      const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return { start: format(start, 'yyyy-MM-dd'), end: format(end, 'yyyy-MM-dd') };
    }
  }, [selectedDate, view]);

  const { data: appointments, isLoading } = useAppointmentsByRange(dateRange.start, dateRange.end);
  const { data: stats } = useAppointmentStats();
  const { data: classStats } = useClassStats();

  const unitId = profile?.unit_id;

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateAppointments = appointments?.filter(a => a.scheduled_date === selectedDateStr) || [];

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Agendamentos
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie aulas, avaliações e horários
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Aulas Coletivas</span>
            </TabsTrigger>
            {(isGestor || isProfessor) && (
              <TabsTrigger value="modalities" className="gap-2">
                <Dumbbell className="h-4 w-4" />
                <span className="hidden sm:inline">Modalidades</span>
              </TabsTrigger>
            )}
            {(isGestor || isProfessor) && (
              <TabsTrigger value="availability" className="gap-2">
                <UserCog className="h-4 w-4" />
                <span className="hidden sm:inline">Disponibilidade</span>
              </TabsTrigger>
            )}
            {isGestor && (
              <TabsTrigger value="blocks" className="gap-2">
                <Ban className="h-4 w-4" />
                <span className="hidden sm:inline">Bloqueios</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="calendar" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Hoje
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.todayCount || 0}</div>
                  <p className="text-xs text-muted-foreground">agendamentos</p>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Aulas Hoje
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classStats?.todayClasses || 0}</div>
                  <p className="text-xs text-muted-foreground">aulas coletivas</p>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pendentes
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-warning/10">
                    <AlertCircle className="h-4 w-4 text-warning" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.pendingCount || 0}</div>
                  <p className="text-xs text-muted-foreground">aguardando confirmação</p>
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Concluídos
                  </CardTitle>
                  <div className="p-2 rounded-lg bg-success/10">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.completedCount || 0}</div>
                  <p className="text-xs text-muted-foreground">total realizados</p>
                </CardContent>
              </Card>
            </div>

        {/* View Selector */}
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Semana
          </Button>
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            <CalendarRange className="h-4 w-4 mr-2" />
            Mês
          </Button>
        </div>

        {/* Calendar and Day Details */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Calendar View */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-[600px] w-full" />
            ) : view === 'week' ? (
              <WeeklyCalendar
                appointments={appointments || []}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            ) : (
              <MonthlyCalendar
                appointments={appointments || []}
                onDateSelect={setSelectedDate}
                selectedDate={selectedDate}
              />
            )}
          </div>

          {/* Selected Day Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                {selectedDateAppointments.length} agendamento{selectedDateAppointments.length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedDateAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum agendamento neste dia</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setCreateDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                </div>
              ) : (
                selectedDateAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    compact
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="mt-6">
            {unitId && <ClassScheduleView unitId={unitId} />}
          </TabsContent>

          {/* Modalities Tab */}
          {(isGestor || isProfessor) && unitId && (
            <TabsContent value="modalities" className="mt-6">
              <ClassTypesManager unitId={unitId} />
            </TabsContent>
          )}

          {(isGestor || isProfessor) && unitId && (
            <TabsContent value="availability" className="mt-6">
              <ProfessorAvailabilityManager unitId={unitId} />
            </TabsContent>
          )}

          {isGestor && unitId && (
            <TabsContent value="blocks" className="mt-6">
              <ScheduleBlockManager unitId={unitId} />
            </TabsContent>
          )}
        </Tabs>

        {/* Create Dialog */}
        {unitId && (
          <CreateAppointmentDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            unitId={unitId}
            preSelectedDate={selectedDate}
          />
        )}
      </div>
    </AppLayout>
  );
}
