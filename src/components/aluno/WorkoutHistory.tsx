import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { useWorkoutLogs } from '@/hooks/useWorkoutLogs';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useExercises } from '@/hooks/useExercises';
import { 
  History, 
  Dumbbell, 
  Calendar,
  Weight,
  ChevronDown,
  ChevronUp,
  Filter,
  X,
  Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { format, startOfDay, isWithinInterval, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';
import { LoadEvolutionCharts } from './LoadEvolutionCharts';
import { useUnit } from '@/hooks/useUnits';
import { useToast } from '@/hooks/use-toast';

interface WorkoutHistoryProps {
  leadId: string | undefined;
  unitId?: string;
}

interface GroupedLog {
  date: Date;
  dateStr: string;
  logs: Array<{
    id: string;
    exerciseName: string;
    workoutName: string;
    workoutId: string;
    muscleGroup: string | null;
    setsCompleted: number | null;
    repsCompleted: string | null;
    loadUsed: number | null;
    completedAt: string;
  }>;
}

type PeriodFilter = 'all' | '7days' | '30days' | 'thisMonth' | 'lastMonth' | 'custom';

export function WorkoutHistory({ leadId, unitId }: WorkoutHistoryProps) {
  const { data: logs, isLoading: logsLoading } = useWorkoutLogs(leadId);
  const { data: workouts, isLoading: workoutsLoading } = useWorkouts(leadId);
  const { data: exercises } = useExercises();
  const { data: unit } = useUnit(unitId || '');
  const { toast } = useToast();
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter states
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [workoutFilter, setWorkoutFilter] = useState<string>('all');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('all');

  const isLoading = logsLoading || workoutsLoading;

  // Create lookup maps for workout and exercise names
  const workoutMap = new Map<string, string>();
  const exerciseMap = new Map<string, { name: string; muscleGroup: string | null }>();
  
  workouts?.forEach(w => {
    workoutMap.set(w.id, w.name);
    w.workout_exercises?.forEach(ex => {
      const exerciseDetails = exercises?.find(e => e.id === ex.exercise_id);
      exerciseMap.set(ex.id, { 
        name: ex.exercise_name, 
        muscleGroup: exerciseDetails?.muscle_group || null 
      });
    });
  });

  // Get unique muscle groups from exercises
  const muscleGroups = useMemo(() => {
    const groups = new Set<string>();
    exercises?.forEach(ex => {
      if (ex.muscle_group) groups.add(ex.muscle_group);
    });
    return Array.from(groups).sort();
  }, [exercises]);

  // Calculate date range based on period filter
  const getDateRange = (): { start: Date; end: Date } | null => {
    const today = new Date();
    switch (periodFilter) {
      case '7days':
        return { start: subDays(today, 7), end: today };
      case '30days':
        return { start: subDays(today, 30), end: today };
      case 'thisMonth':
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'custom':
        if (customDateRange?.from && customDateRange?.to) {
          return { start: customDateRange.from, end: customDateRange.to };
        }
        return null;
      default:
        return null;
    }
  };

  // Group and filter logs
  const groupedLogs: GroupedLog[] = useMemo(() => {
    if (!logs) return [];
    
    const dateRange = getDateRange();
    const dateMap = new Map<string, GroupedLog>();
    
    logs.forEach(log => {
      const logDate = startOfDay(new Date(log.completed_at));
      const exerciseInfo = exerciseMap.get(log.workout_exercise_id);
      
      // Apply date filter
      if (dateRange && !isWithinInterval(logDate, { start: dateRange.start, end: dateRange.end })) {
        return;
      }
      
      // Apply workout filter
      if (workoutFilter !== 'all' && log.workout_id !== workoutFilter) {
        return;
      }
      
      // Apply muscle group filter
      if (muscleGroupFilter !== 'all' && exerciseInfo?.muscleGroup !== muscleGroupFilter) {
        return;
      }
      
      const dateKey = format(logDate, 'yyyy-MM-dd');
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: logDate,
          dateStr: dateKey,
          logs: []
        });
      }
      
      dateMap.get(dateKey)?.logs.push({
        id: log.id,
        exerciseName: exerciseInfo?.name || 'Exercício',
        workoutName: workoutMap.get(log.workout_id) || 'Treino',
        workoutId: log.workout_id,
        muscleGroup: exerciseInfo?.muscleGroup || null,
        setsCompleted: log.sets_completed,
        repsCompleted: log.reps_completed,
        loadUsed: log.load_used,
        completedAt: log.completed_at
      });
    });
    
    return Array.from(dateMap.values())
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [logs, periodFilter, customDateRange, workoutFilter, muscleGroupFilter, exerciseMap, workoutMap]);

  const hasActiveFilters = periodFilter !== 'all' || workoutFilter !== 'all' || muscleGroupFilter !== 'all';

  const clearFilters = () => {
    setPeriodFilter('all');
    setWorkoutFilter('all');
    setMuscleGroupFilter('all');
    setCustomDateRange(undefined);
  };

  // Generate PDF export
  const exportToPDF = async () => {
    setIsExporting(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;
      
      // Try to add logo if available
      if (unit?.logo_url) {
        try {
          const response = await fetch(unit.logo_url);
          const blob = await response.blob();
          const reader = new FileReader();
          
          await new Promise<void>((resolve, reject) => {
            reader.onload = () => {
              try {
                const imgData = reader.result as string;
                // Add logo centered at top
                doc.addImage(imgData, 'PNG', pageWidth / 2 - 20, yPos, 40, 20);
                yPos += 28;
                resolve();
              } catch {
                resolve(); // Continue without logo if it fails
              }
            };
            reader.onerror = () => resolve(); // Continue without logo if it fails
            reader.readAsDataURL(blob);
          });
        } catch {
          // Continue without logo if fetch fails
        }
      }
      
      // Unit name if available
      if (unit?.name) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(unit.name, pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
      }
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('Histórico de Treinos', pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
      
      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 15;
      
      // Summary Stats
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Resumo', 14, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Dias Treinados: ${totalDays}`, 14, yPos);
      yPos += 6;
      doc.text(`• Exercícios Realizados: ${totalExercises}`, 14, yPos);
      yPos += 6;
      doc.text(`• Média de Carga: ${avgLoadUsed > 0 ? `${avgLoadUsed.toFixed(1)}kg` : '--'}`, 14, yPos);
      yPos += 15;
      
      // Workout Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Detalhes dos Treinos', 14, yPos);
      yPos += 10;
      
      groupedLogs.forEach((group) => {
      // Check if we need a new page
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      
      // Date header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(240, 240, 240);
      doc.rect(14, yPos - 5, pageWidth - 28, 8, 'F');
      doc.text(format(group.date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 16, yPos);
      yPos += 10;
      
      // Table header
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Exercício', 16, yPos);
      doc.text('Séries', 90, yPos);
      doc.text('Reps', 115, yPos);
      doc.text('Carga', 140, yPos);
      doc.text('Hora', 165, yPos);
      yPos += 6;
      
      // Draw line
      doc.setDrawColor(200, 200, 200);
      doc.line(14, yPos - 3, pageWidth - 14, yPos - 3);
      
      // Table rows
      doc.setFont('helvetica', 'normal');
      group.logs.forEach((log) => {
        if (yPos > 280) {
          doc.addPage();
          yPos = 20;
        }
        
        // Truncate exercise name if too long
        const exerciseName = log.exerciseName.length > 35 
          ? log.exerciseName.substring(0, 32) + '...' 
          : log.exerciseName;
        
        doc.text(exerciseName, 16, yPos);
        doc.text(log.setsCompleted?.toString() || '--', 90, yPos);
        doc.text(log.repsCompleted || '--', 115, yPos);
        doc.text(log.loadUsed ? `${log.loadUsed}kg` : '--', 140, yPos);
        doc.text(format(new Date(log.completedAt), 'HH:mm'), 165, yPos);
        yPos += 5;
      });
      
      yPos += 8;
    });
    
    // Footer on last page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Página ${i} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Download
    doc.save(`historico-treinos-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    
    toast({
      title: 'PDF exportado',
      description: 'Seu histórico de treinos foi baixado com sucesso.',
    });
    } catch (error) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível gerar o PDF. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const toggleDate = (dateStr: string) => {
    setExpandedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dateStr)) {
        newSet.delete(dateStr);
      } else {
        newSet.add(dateStr);
      }
      return newSet;
    });
  };

  // Calculate totals
  const totalExercises = logs?.length || 0;
  const totalDays = groupedLogs.length;
  const avgLoadUsed = logs?.length 
    ? logs.filter(l => l.load_used).reduce((acc, l) => acc + (l.load_used || 0), 0) / logs.filter(l => l.load_used).length
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico de Treinos
          </CardTitle>
          <CardDescription>Todos os exercícios realizados</CardDescription>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Nenhum exercício registrado ainda.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Complete seus treinos para ver o histórico aqui.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History className="h-6 w-6 text-primary" />
            Histórico de Treinos
          </h2>
          <p className="text-muted-foreground text-sm">Acompanhe sua evolução ao longo do tempo</p>
        </div>
        <Button onClick={exportToPDF} variant="outline" className="gap-2" disabled={isExporting}>
          <Download className="h-4 w-4" />
          {isExporting ? 'Gerando...' : 'Exportar PDF'}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Dias Treinados</p>
                <p className="text-2xl font-bold">{totalDays}</p>
              </div>
              <Calendar className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Exercícios Feitos</p>
                <p className="text-2xl font-bold">{totalExercises}</p>
              </div>
              <Dumbbell className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média de Carga</p>
                <p className="text-2xl font-bold">
                  {avgLoadUsed > 0 ? `${avgLoadUsed.toFixed(1)}kg` : '--'}
                </p>
              </div>
              <Weight className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Load Evolution Charts */}
      <LoadEvolutionCharts logs={logs} workouts={workouts} />

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 gap-1">
                <X className="h-3 w-3" />
                Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {/* Period Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Período</label>
              <Select value={periodFilter} onValueChange={(v) => setPeriodFilter(v as PeriodFilter)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                  <SelectItem value="thisMonth">Este mês</SelectItem>
                  <SelectItem value="lastMonth">Mês passado</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              
              {periodFilter === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full mt-2 justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      {customDateRange?.from ? (
                        customDateRange.to ? (
                          <>
                            {format(customDateRange.from, "dd/MM")} - {format(customDateRange.to, "dd/MM")}
                          </>
                        ) : (
                          format(customDateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Selecionar datas"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="range"
                      selected={customDateRange}
                      onSelect={setCustomDateRange}
                      locale={ptBR}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>

            {/* Workout Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Tipo de Treino</label>
              <Select value={workoutFilter} onValueChange={setWorkoutFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o treino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {workouts?.map(w => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Muscle Group Filter */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-muted-foreground">Grupo Muscular</label>
              <Select value={muscleGroupFilter} onValueChange={setMuscleGroupFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o grupo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {muscleGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Histórico Completo
          </CardTitle>
          <CardDescription>
            {totalDays} {totalDays === 1 ? 'dia' : 'dias'} de treino {hasActiveFilters ? 'encontrados' : 'registrados'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="divide-y divide-border">
              {groupedLogs.map((group) => (
                <div key={group.dateStr}>
                  {/* Date Header */}
                  <button
                    onClick={() => toggleDate(group.dateStr)}
                    className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">
                          {format(group.date, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {group.logs.length} {group.logs.length === 1 ? 'exercício' : 'exercícios'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {group.logs[0]?.workoutName}
                      </Badge>
                      {expandedDates.has(group.dateStr) ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Exercise Details */}
                  {expandedDates.has(group.dateStr) && (
                    <div className="bg-muted/30 px-4 pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Exercício</TableHead>
                            <TableHead className="text-center">Séries</TableHead>
                            <TableHead className="text-center">Reps</TableHead>
                            <TableHead className="text-center">Carga</TableHead>
                            <TableHead className="text-right">Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.logs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="font-medium">
                                {log.exerciseName}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.setsCompleted || '--'}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.repsCompleted || '--'}
                              </TableCell>
                              <TableCell className="text-center">
                                {log.loadUsed ? `${log.loadUsed}kg` : '--'}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {format(new Date(log.completedAt), 'HH:mm')}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
