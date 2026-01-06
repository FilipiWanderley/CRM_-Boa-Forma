import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Activity, Calendar, QrCode, Fingerprint, UserCheck } from 'lucide-react';
import type { CheckIn } from '@/hooks/useCheckIns';

interface CheckInHistoryProps {
  checkIns: CheckIn[];
  loading?: boolean;
}

const methodIcons: Record<string, React.ReactNode> = {
  qr_code: <QrCode className="h-4 w-4" />,
  biometria: <Fingerprint className="h-4 w-4" />,
  manual: <UserCheck className="h-4 w-4" />,
};

const methodLabels: Record<string, string> = {
  qr_code: 'QR Code',
  biometria: 'Biometria',
  manual: 'Manual',
};

export function CheckInHistory({ checkIns, loading }: CheckInHistoryProps) {
  // Group check-ins by date
  const groupedCheckIns = checkIns.reduce((acc, checkIn) => {
    const date = format(new Date(checkIn.checked_in_at), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(checkIn);
    return acc;
  }, {} as Record<string, CheckIn[]>);

  const sortedDates = Object.keys(groupedCheckIns).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <Card className="card-glow">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle>Histórico de Frequência</CardTitle>
        </div>
        <CardDescription>
          Seus últimos acessos à academia
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-secondary/50 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : checkIns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum check-in registrado ainda.</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    {format(new Date(date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="space-y-2">
                    {groupedCheckIns[date].map((checkIn) => (
                      <div
                        key={checkIn.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-success/10 text-success">
                            {methodIcons[checkIn.method] || <Activity className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">Check-in</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(checkIn.checked_in_at), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {methodLabels[checkIn.method] || checkIn.method}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
