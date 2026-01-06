import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePhysicalAssessments, PhysicalAssessment } from '@/hooks/usePhysicalAssessments';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';

interface EvolutionChartsProps {
  leadId: string;
}

export function EvolutionCharts({ leadId }: EvolutionChartsProps) {
  const { data: assessments, isLoading } = usePhysicalAssessments(leadId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[300px] w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (!assessments || assessments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Nenhuma avaliação física registrada.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Registre avaliações para acompanhar a evolução do aluno.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = assessments.map((a) => ({
    date: format(new Date(a.assessment_date), 'dd/MM/yy', { locale: ptBR }),
    fullDate: a.assessment_date,
    peso: a.weight,
    gordura: a.body_fat_percentage,
    massaMuscular: a.muscle_mass,
    imc: a.bmi,
    cintura: a.waist,
    peito: a.chest,
    quadril: a.hips,
    bracoDireito: a.right_arm,
    bracoEsquerdo: a.left_arm,
    coxaDireita: a.right_thigh,
    coxaEsquerda: a.left_thigh,
  }));

  // Calculate evolution stats
  const first = assessments[0];
  const last = assessments[assessments.length - 1];
  
  const weightChange = first.weight && last.weight ? last.weight - first.weight : null;
  const fatChange = first.body_fat_percentage && last.body_fat_percentage 
    ? last.body_fat_percentage - first.body_fat_percentage : null;
  const muscleChange = first.muscle_mass && last.muscle_mass 
    ? last.muscle_mass - first.muscle_mass : null;

  const getTrendIcon = (value: number | null, inverted = false) => {
    if (value === null) return <Minus className="h-4 w-4 text-muted-foreground" />;
    const isPositive = inverted ? value < 0 : value > 0;
    if (Math.abs(value) < 0.1) return <Minus className="h-4 w-4 text-muted-foreground" />;
    return isPositive 
      ? <TrendingUp className="h-4 w-4 text-success" />
      : <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Evolution Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Peso
              {getTrendIcon(weightChange, true)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {last.weight ? `${last.weight} kg` : '-'}
            </div>
            {weightChange !== null && (
              <p className={`text-xs ${weightChange < 0 ? 'text-success' : weightChange > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} kg desde a primeira avaliação
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              % Gordura
              {getTrendIcon(fatChange, true)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {last.body_fat_percentage ? `${last.body_fat_percentage}%` : '-'}
            </div>
            {fatChange !== null && (
              <p className={`text-xs ${fatChange < 0 ? 'text-success' : fatChange > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {fatChange > 0 ? '+' : ''}{fatChange.toFixed(1)}% desde a primeira avaliação
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
              Massa Muscular
              {getTrendIcon(muscleChange)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {last.muscle_mass ? `${last.muscle_mass} kg` : '-'}
            </div>
            {muscleChange !== null && (
              <p className={`text-xs ${muscleChange > 0 ? 'text-success' : muscleChange < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {muscleChange > 0 ? '+' : ''}{muscleChange.toFixed(1)} kg desde a primeira avaliação
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Weight & Body Composition Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Peso e Composição Corporal</CardTitle>
          <CardDescription>
            {assessments.length} avaliação(ões) registrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis yAxisId="left" className="text-xs" />
              <YAxis yAxisId="right" orientation="right" className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="peso"
                name="Peso (kg)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="gordura"
                name="Gordura (%)"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="massaMuscular"
                name="Massa Muscular (kg)"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--success))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Circumferences Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução de Medidas</CardTitle>
          <CardDescription>
            Circunferências em centímetros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="cintura" name="Cintura" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="peito" name="Peito" stroke="#3b82f6" strokeWidth={2} />
              <Line type="monotone" dataKey="quadril" name="Quadril" stroke="#8b5cf6" strokeWidth={2} />
              <Line type="monotone" dataKey="bracoDireito" name="Braço D." stroke="#22c55e" strokeWidth={2} />
              <Line type="monotone" dataKey="coxaDireita" name="Coxa D." stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Assessment History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Avaliações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium">Data</th>
                  <th className="text-right py-2 px-2 font-medium">Peso</th>
                  <th className="text-right py-2 px-2 font-medium">% Gordura</th>
                  <th className="text-right py-2 px-2 font-medium">Massa M.</th>
                  <th className="text-right py-2 px-2 font-medium">IMC</th>
                  <th className="text-right py-2 px-2 font-medium">Cintura</th>
                </tr>
              </thead>
              <tbody>
                {[...assessments].reverse().map((a) => (
                  <tr key={a.id} className="border-b border-muted/50">
                    <td className="py-2 px-2">
                      {format(new Date(a.assessment_date), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="text-right py-2 px-2">{a.weight ? `${a.weight} kg` : '-'}</td>
                    <td className="text-right py-2 px-2">{a.body_fat_percentage ? `${a.body_fat_percentage}%` : '-'}</td>
                    <td className="text-right py-2 px-2">{a.muscle_mass ? `${a.muscle_mass} kg` : '-'}</td>
                    <td className="text-right py-2 px-2">{a.bmi || '-'}</td>
                    <td className="text-right py-2 px-2">{a.waist ? `${a.waist} cm` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
