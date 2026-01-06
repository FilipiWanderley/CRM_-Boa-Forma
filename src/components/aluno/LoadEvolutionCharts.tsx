import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkoutLog {
  id: string;
  workout_id: string;
  workout_exercise_id: string;
  load_used: number | null;
  sets_completed: number | null;
  reps_completed: string | null;
  completed_at: string;
}

interface Workout {
  id: string;
  name: string;
  workout_exercises?: Array<{
    id: string;
    exercise_name: string;
    exercise_id: string | null;
  }>;
}

interface LoadEvolutionChartsProps {
  logs: WorkoutLog[] | undefined;
  workouts: Workout[] | undefined;
}

interface ExerciseData {
  exerciseId: string;
  exerciseName: string;
  data: Array<{
    date: string;
    dateFormatted: string;
    load: number;
  }>;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  maxLoad: number;
  avgLoad: number;
}

export function LoadEvolutionCharts({ logs, workouts }: LoadEvolutionChartsProps) {
  const [selectedExercise, setSelectedExercise] = useState<string>('all');

  // Build exercise lookup map
  const exerciseMap = useMemo(() => {
    const map = new Map<string, string>();
    workouts?.forEach(w => {
      w.workout_exercises?.forEach(ex => {
        map.set(ex.id, ex.exercise_name);
      });
    });
    return map;
  }, [workouts]);

  // Process logs into exercise evolution data
  const exerciseEvolutionData: ExerciseData[] = useMemo(() => {
    if (!logs || logs.length === 0) return [];

    // Group logs by exercise
    const exerciseLogsMap = new Map<string, Array<{ date: Date; load: number }>>();
    
    logs.forEach(log => {
      if (log.load_used && log.load_used > 0) {
        const exerciseName = exerciseMap.get(log.workout_exercise_id);
        if (!exerciseName) return;
        
        if (!exerciseLogsMap.has(exerciseName)) {
          exerciseLogsMap.set(exerciseName, []);
        }
        
        exerciseLogsMap.get(exerciseName)?.push({
          date: new Date(log.completed_at),
          load: log.load_used
        });
      }
    });

    // Process each exercise
    const result: ExerciseData[] = [];
    
    exerciseLogsMap.forEach((entries, exerciseName) => {
      // Sort by date ascending
      entries.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Aggregate by date (take max load per day)
      const dateMap = new Map<string, number>();
      entries.forEach(entry => {
        const dateKey = format(entry.date, 'yyyy-MM-dd');
        const existingLoad = dateMap.get(dateKey) || 0;
        dateMap.set(dateKey, Math.max(existingLoad, entry.load));
      });
      
      const data = Array.from(dateMap.entries()).map(([date, load]) => ({
        date,
        dateFormatted: format(new Date(date), 'dd/MM', { locale: ptBR }),
        load
      }));
      
      if (data.length < 2) {
        // Need at least 2 data points for evolution
        return;
      }
      
      // Calculate trend
      const firstLoad = data[0].load;
      const lastLoad = data[data.length - 1].load;
      const percentChange = ((lastLoad - firstLoad) / firstLoad) * 100;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (percentChange > 5) trend = 'up';
      else if (percentChange < -5) trend = 'down';
      
      const allLoads = data.map(d => d.load);
      const maxLoad = Math.max(...allLoads);
      const avgLoad = allLoads.reduce((a, b) => a + b, 0) / allLoads.length;
      
      result.push({
        exerciseId: exerciseName,
        exerciseName,
        data,
        trend,
        percentChange,
        maxLoad,
        avgLoad
      });
    });
    
    // Sort by number of data points (most tracked first)
    return result.sort((a, b) => b.data.length - a.data.length);
  }, [logs, exerciseMap]);

  // Get unique exercise names for filter
  const exerciseNames = exerciseEvolutionData.map(e => e.exerciseName);

  // Filter data based on selection
  const filteredData = selectedExercise === 'all' 
    ? exerciseEvolutionData.slice(0, 4) // Show top 4 exercises
    : exerciseEvolutionData.filter(e => e.exerciseName === selectedExercise);

  if (exerciseEvolutionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Evolução de Carga
          </CardTitle>
          <CardDescription>Acompanhe seu progresso ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Dados insuficientes para gerar gráficos.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Continue treinando e registrando suas cargas.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evolução de Carga
            </CardTitle>
            <CardDescription>Acompanhe seu progresso ao longo do tempo</CardDescription>
          </div>
          <Select value={selectedExercise} onValueChange={setSelectedExercise}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecione exercício" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Top 4 Exercícios</SelectItem>
              {exerciseNames.map(name => (
                <SelectItem key={name} value={name}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filteredData.map((exercise) => (
            <div
              key={exercise.exerciseName}
              className="p-3 rounded-lg border bg-card"
            >
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium truncate flex-1" title={exercise.exerciseName}>
                  {exercise.exerciseName}
                </p>
                <TrendIcon trend={exercise.trend} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{exercise.maxLoad}kg</span>
                <Badge 
                  variant={exercise.trend === 'up' ? 'default' : exercise.trend === 'down' ? 'destructive' : 'secondary'}
                  className="text-xs"
                >
                  {exercise.percentChange > 0 ? '+' : ''}{exercise.percentChange.toFixed(0)}%
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Média: {exercise.avgLoad.toFixed(1)}kg • {exercise.data.length} registros
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className={`grid gap-4 ${filteredData.length === 1 ? '' : 'sm:grid-cols-2'}`}>
          {filteredData.map((exercise) => (
            <div key={exercise.exerciseName} className="p-4 rounded-lg border bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-sm">{exercise.exerciseName}</h4>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendIcon trend={exercise.trend} />
                  <span>
                    {exercise.trend === 'up' && 'Evoluindo'}
                    {exercise.trend === 'down' && 'Diminuindo'}
                    {exercise.trend === 'stable' && 'Estável'}
                  </span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={exercise.data}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="dateFormatted" 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      className="text-muted-foreground"
                      domain={['auto', 'auto']}
                      tickFormatter={(value) => `${value}kg`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      formatter={(value: number) => [`${value}kg`, 'Carga']}
                    />
                    <Line
                      type="monotone"
                      dataKey="load"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}