import { useState, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared';
import { usePeriodComparison, useWeeklyHeatmap, useMonthlyHeatmap, useRevenueForecast } from '@/hooks/useAdvancedStats';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  FileText, Download, TrendingUp, TrendingDown, Calendar, 
  BarChart3, Clock, DollarSign, Users, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import jsPDF from 'jspdf';
import { useToast } from '@/hooks/use-toast';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const HOURS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

function getHeatmapColor(count: number, max: number): string {
  if (count === 0) return 'bg-muted';
  const intensity = count / max;
  if (intensity < 0.25) return 'bg-primary/20';
  if (intensity < 0.5) return 'bg-primary/40';
  if (intensity < 0.75) return 'bg-primary/60';
  return 'bg-primary';
}

export default function AdvancedReports() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${now.getMonth()}`;
  });
  const [compareMonths, setCompareMonths] = useState('1');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: comparison, isLoading: comparisonLoading } = usePeriodComparison(Number(compareMonths));
  const { data: weeklyHeatmap, isLoading: weeklyLoading } = useWeeklyHeatmap();
  const { data: forecast, isLoading: forecastLoading } = useRevenueForecast(6);
  
  const [year, month] = selectedMonth.split('-').map(Number);
  const { data: monthlyHeatmap, isLoading: monthlyLoading } = useMonthlyHeatmap(year, month);

  const maxWeeklyCount = weeklyHeatmap ? Math.max(...weeklyHeatmap.map(c => c.count), 1) : 1;
  const maxMonthlyCount = monthlyHeatmap ? Math.max(...monthlyHeatmap.map(c => c.count), 1) : 1;

  const formatCurrency = (value: number) => 
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const exportToPDF = () => {
    const doc = new jsPDF();
    const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    
    // Header
    doc.setFontSize(20);
    doc.text('Relatório Gerencial', 20, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${today}`, 20, 28);
    
    // KPIs Section
    doc.setFontSize(14);
    doc.text('Indicadores Principais', 20, 45);
    doc.setFontSize(10);
    
    if (stats) {
      doc.text(`Receita do Mês: ${formatCurrency(stats.currentMonthRevenue)}`, 25, 55);
      doc.text(`Alunos Ativos: ${stats.activeClients}`, 25, 62);
      doc.text(`Taxa de Conversão: ${stats.conversionRate.toFixed(1)}%`, 25, 69);
      doc.text(`Taxa de Churn: ${stats.churnRate.toFixed(1)}%`, 25, 76);
      doc.text(`Inadimplência: ${formatCurrency(stats.overdueAmount)}`, 25, 83);
    }

    // Comparison Section
    if (comparison) {
      doc.setFontSize(14);
      doc.text('Comparativo com Período Anterior', 20, 100);
      doc.setFontSize(10);
      
      doc.text(`Receita: ${formatCurrency(comparison.currentPeriod.revenue)} (${comparison.percentageChanges.revenue >= 0 ? '+' : ''}${comparison.percentageChanges.revenue.toFixed(1)}%)`, 25, 110);
      doc.text(`Leads: ${comparison.currentPeriod.leads} (${comparison.percentageChanges.leads >= 0 ? '+' : ''}${comparison.percentageChanges.leads.toFixed(1)}%)`, 25, 117);
      doc.text(`Conversões: ${comparison.currentPeriod.conversions} (${comparison.percentageChanges.conversions >= 0 ? '+' : ''}${comparison.percentageChanges.conversions.toFixed(1)}%)`, 25, 124);
      doc.text(`Check-ins: ${comparison.currentPeriod.checkIns} (${comparison.percentageChanges.checkIns >= 0 ? '+' : ''}${comparison.percentageChanges.checkIns.toFixed(1)}%)`, 25, 131);
    }

    // Forecast Section
    if (forecast) {
      doc.setFontSize(14);
      doc.text('Previsão de Receita', 20, 150);
      doc.setFontSize(10);
      
      forecast.forEach((f, idx) => {
        const total = f.confirmed + f.projected + f.atRisk;
        doc.text(`${f.month}: ${formatCurrency(total)} (Confirmado: ${formatCurrency(f.confirmed)}, Em Risco: ${formatCurrency(f.atRisk)})`, 25, 160 + (idx * 7));
      });
    }

    doc.save(`relatorio-gerencial-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast({ title: 'Relatório exportado com sucesso!' });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Relatórios Avançados"
          subtitle="Análises detalhadas e exportação de relatórios"
          actions={
            <Button onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-2" />
              Exportar PDF
            </Button>
          }
        />

        <Tabs defaultValue="comparison" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="comparison">Comparativo</TabsTrigger>
            <TabsTrigger value="heatmap">Frequência</TabsTrigger>
            <TabsTrigger value="forecast">Previsão</TabsTrigger>
            <TabsTrigger value="summary">Resumo</TabsTrigger>
          </TabsList>

          {/* Comparativo de Períodos */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Comparativo de Períodos
                  </CardTitle>
                  <Select value={compareMonths} onValueChange={setCompareMonths}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Comparar com mês anterior</SelectItem>
                      <SelectItem value="3">Comparar com 3 meses atrás</SelectItem>
                      <SelectItem value="6">Comparar com 6 meses atrás</SelectItem>
                      <SelectItem value="12">Comparar com ano anterior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {comparisonLoading ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32" />)}
                  </div>
                ) : comparison ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    {[
                      { label: 'Receita', current: formatCurrency(comparison.currentPeriod.revenue), previous: formatCurrency(comparison.previousPeriod.revenue), change: comparison.percentageChanges.revenue, icon: DollarSign },
                      { label: 'Leads', current: comparison.currentPeriod.leads, previous: comparison.previousPeriod.leads, change: comparison.percentageChanges.leads, icon: Users },
                      { label: 'Conversões', current: comparison.currentPeriod.conversions, previous: comparison.previousPeriod.conversions, change: comparison.percentageChanges.conversions, icon: TrendingUp },
                      { label: 'Churn', current: comparison.currentPeriod.churn, previous: comparison.previousPeriod.churn, change: comparison.percentageChanges.churn, icon: TrendingDown, invertColor: true },
                      { label: 'Check-ins', current: comparison.currentPeriod.checkIns, previous: comparison.previousPeriod.checkIns, change: comparison.percentageChanges.checkIns, icon: Activity },
                    ].map((metric) => (
                      <Card key={metric.label} className="bg-muted/30">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <metric.icon className="h-5 w-5 text-muted-foreground" />
                            <Badge variant={
                              metric.invertColor 
                                ? (metric.change <= 0 ? 'default' : 'destructive')
                                : (metric.change >= 0 ? 'default' : 'destructive')
                            }>
                              {metric.change >= 0 ? '+' : ''}{metric.change.toFixed(1)}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                          <p className="text-2xl font-bold">{metric.current}</p>
                          <p className="text-xs text-muted-foreground">Anterior: {metric.previous}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Mapa de Calor */}
          <TabsContent value="heatmap" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Semanal */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Frequência por Dia/Hora
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : weeklyHeatmap ? (
                    <div className="overflow-x-auto">
                      <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${HOURS.length}, 1fr)` }}>
                        <div />
                        {HOURS.map(hour => (
                          <div key={hour} className="text-xs text-center text-muted-foreground p-1">
                            {hour}h
                          </div>
                        ))}
                        {DAYS.map((day, dayIdx) => (
                          <>
                            <div key={`day-${dayIdx}`} className="text-xs text-muted-foreground p-1 font-medium">
                              {day}
                            </div>
                            {HOURS.map(hour => {
                              const cell = weeklyHeatmap.find(c => c.day === dayIdx && c.hour === hour);
                              return (
                                <div
                                  key={`${dayIdx}-${hour}`}
                                  className={cn(
                                    "aspect-square rounded text-xs flex items-center justify-center cursor-default transition-colors",
                                    getHeatmapColor(cell?.count || 0, maxWeeklyCount)
                                  )}
                                  title={`${day} ${hour}h: ${cell?.count || 0} check-ins`}
                                >
                                  {(cell?.count || 0) > 0 && (
                                    <span className="text-[10px] font-medium">{cell?.count}</span>
                                  )}
                                </div>
                              );
                            })}
                          </>
                        ))}
                      </div>
                      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
                        <span>Menos</span>
                        <div className="flex gap-1">
                          <div className="w-4 h-4 rounded bg-muted" />
                          <div className="w-4 h-4 rounded bg-primary/20" />
                          <div className="w-4 h-4 rounded bg-primary/40" />
                          <div className="w-4 h-4 rounded bg-primary/60" />
                          <div className="w-4 h-4 rounded bg-primary" />
                        </div>
                        <span>Mais</span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Mensal */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Frequência Mensal
                    </CardTitle>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const date = subMonths(new Date(), i);
                          const value = `${date.getFullYear()}-${date.getMonth()}`;
                          return (
                            <SelectItem key={value} value={value}>
                              {format(date, 'MMMM yyyy', { locale: ptBR })}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent>
                  {monthlyLoading ? (
                    <Skeleton className="h-[300px]" />
                  ) : monthlyHeatmap ? (
                    <div className="grid grid-cols-7 gap-1">
                      {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-xs text-center text-muted-foreground font-medium p-2">
                          {d}
                        </div>
                      ))}
                      {/* Add empty cells for alignment */}
                      {Array.from({ length: new Date(year, month, 1).getDay() }, (_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {monthlyHeatmap.map(cell => (
                        <div
                          key={cell.date}
                          className={cn(
                            "aspect-square rounded flex flex-col items-center justify-center cursor-default transition-colors p-1",
                            getHeatmapColor(cell.count, maxMonthlyCount)
                          )}
                          title={`${cell.date}: ${cell.count} check-ins`}
                        >
                          <span className="text-xs font-medium">{cell.dayOfMonth}</span>
                          {cell.count > 0 && (
                            <span className="text-[10px] text-muted-foreground">{cell.count}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Previsão de Receita */}
          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Previsão de Receita - Próximos 6 Meses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {forecastLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : forecast ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={12}
                          tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload?.length) {
                              return (
                                <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
                                  <p className="font-semibold mb-2">{label}</p>
                                  {payload.map((entry: any, idx: number) => (
                                    <p key={idx} className="text-sm flex items-center gap-2">
                                      <span className="w-3 h-3 rounded" style={{ backgroundColor: entry.color }} />
                                      {entry.name}: {formatCurrency(entry.value)}
                                    </p>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="confirmed" name="Confirmado" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="projected" name="Projetado" stackId="a" fill="hsl(var(--primary) / 0.5)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="atRisk" name="Em Risco" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex justify-center gap-6 mt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded bg-primary" />
                        <span>Confirmado</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded bg-primary/50" />
                        <span>Projetado</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span>Em Risco</span>
                      </div>
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            {/* Forecast Details */}
            {forecast && (
              <div className="grid gap-4 md:grid-cols-3">
                {forecast.slice(0, 3).map((f) => (
                  <Card key={f.month}>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-1">{f.month}</p>
                      <p className="text-2xl font-bold">{formatCurrency(f.confirmed + f.projected + f.atRisk)}</p>
                      <div className="mt-3 space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confirmado:</span>
                          <span className="text-emerald-600 font-medium">{formatCurrency(f.confirmed)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Projetado:</span>
                          <span className="font-medium">{formatCurrency(f.projected)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Em Risco:</span>
                          <span className="text-red-500 font-medium">{formatCurrency(f.atRisk)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Resumo Geral */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Resumo Executivo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <Skeleton className="h-[200px]" />
                ) : stats ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>
                      No mês atual, a academia registrou uma receita de <strong>{formatCurrency(stats.currentMonthRevenue)}</strong>,
                      {stats.revenueGrowth >= 0 
                        ? ` representando um crescimento de ${stats.revenueGrowth.toFixed(1)}% em relação ao mês anterior.`
                        : ` uma queda de ${Math.abs(stats.revenueGrowth).toFixed(1)}% em relação ao mês anterior.`
                      }
                    </p>
                    <p>
                      Atualmente, a base conta com <strong>{stats.activeClients} alunos ativos</strong> e 
                      <strong> {stats.newLeadsThisMonth} novos leads</strong> foram captados este mês, 
                      com uma taxa de conversão de <strong>{stats.conversionRate.toFixed(1)}%</strong>.
                    </p>
                    <p>
                      A inadimplência está em <strong>{formatCurrency(stats.overdueAmount)}</strong>, 
                      representando <strong>{stats.delinquencyRate.toFixed(1)}%</strong> da carteira.
                      A taxa de churn registrada é de <strong>{stats.churnRate.toFixed(1)}%</strong>.
                    </p>
                    <p>
                      Foram registrados <strong>{stats.totalCheckInsThisMonth} check-ins</strong> durante o mês,
                      indicando uma média de {(stats.totalCheckInsThisMonth / (stats.activeClients || 1)).toFixed(1)} visitas por aluno ativo.
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
