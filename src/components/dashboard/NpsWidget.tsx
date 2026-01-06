import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNps } from '@/hooks/useNps';
import { Skeleton } from '@/components/ui/skeleton';
import { Smile, Meh, Frown, TrendingUp, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function NpsWidget() {
  const { npsStats, statsLoading } = useNps();

  if (statsLoading) {
    return <Skeleton className="h-[200px] w-full" />;
  }

  if (!npsStats) {
    return null;
  }

  const { score, promoters, detractors, passives, total } = npsStats;

  // Classificação
  let zone = '';
  let zoneColor = '';
  let zoneIcon = null;

  if (score >= 75) {
    zone = 'Zona de Excelência';
    zoneColor = 'text-green-600';
    zoneIcon = <TrendingUp className="h-5 w-5" />;
  } else if (score >= 50) {
    zone = 'Zona de Qualidade';
    zoneColor = 'text-green-500';
    zoneIcon = <Smile className="h-5 w-5" />;
  } else if (score >= 0) {
    zone = 'Zona de Aperfeiçoamento';
    zoneColor = 'text-yellow-600';
    zoneIcon = <Meh className="h-5 w-5" />;
  } else {
    zone = 'Zona Crítica';
    zoneColor = 'text-red-600';
    zoneIcon = <AlertCircle className="h-5 w-5" />;
  }

  // Percentuais
  const promoterPct = total > 0 ? (promoters / total) * 100 : 0;
  const passivePct = total > 0 ? (passives / total) * 100 : 0;
  const detractorPct = total > 0 ? (detractors / total) * 100 : 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">NPS (Net Promoter Score)</CardTitle>
        <div className={`flex items-center gap-1 text-sm font-bold ${zoneColor}`}>
          {zoneIcon}
          {zone}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-4">
          <div className={`text-5xl font-bold mb-1 ${zoneColor}`}>
            {score}
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Baseado em {total} avaliações
          </p>

          <div className="w-full space-y-3">
            {/* Promotores */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <Smile className="h-3 w-3" /> Promotores
                </span>
                <span>{Math.round(promoterPct)}% ({promoters})</span>
              </div>
              <Progress value={promoterPct} className="h-2 bg-secondary" indicatorClassName="bg-green-500" />
            </div>

            {/* Neutros */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-yellow-600 font-medium">
                  <Meh className="h-3 w-3" /> Neutros
                </span>
                <span>{Math.round(passivePct)}% ({passives})</span>
              </div>
              <Progress value={passivePct} className="h-2 bg-secondary" indicatorClassName="bg-yellow-500" />
            </div>

            {/* Detratores */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <Frown className="h-3 w-3" /> Detratores
                </span>
                <span>{Math.round(detractorPct)}% ({detractors})</span>
              </div>
              <Progress value={detractorPct} className="h-2 bg-secondary" indicatorClassName="bg-red-500" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
