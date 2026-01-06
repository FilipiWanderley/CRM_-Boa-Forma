import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  automationTypeLabels, 
  automationTypeIcons,
  automationStatusLabels,
  type AutomationStatus
} from '@/hooks/useAutomation';

interface LogWithLead {
  id: string;
  type: string;
  channel: string;
  recipient: string;
  subject: string | null;
  status: AutomationStatus;
  sent_at: string | null;
  created_at: string;
  leads: { full_name: string; email: string } | null;
}

interface AutomationLogTableProps {
  logs: LogWithLead[];
  loading?: boolean;
}

const statusVariants: Record<AutomationStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  sent: 'default',
  failed: 'destructive',
  cancelled: 'outline',
};

export function AutomationLogTable({ logs, loading }: AutomationLogTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma automação disparada ainda.
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tipo</TableHead>
            <TableHead>Destinatário</TableHead>
            <TableHead>Assunto</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span>{automationTypeIcons[log.type as keyof typeof automationTypeIcons]}</span>
                  <span className="text-sm">
                    {automationTypeLabels[log.type as keyof typeof automationTypeLabels]}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium text-sm">
                    {log.leads?.full_name || 'Desconhecido'}
                  </p>
                  <p className="text-xs text-muted-foreground">{log.recipient}</p>
                </div>
              </TableCell>
              <TableCell className="max-w-[200px] truncate">
                {log.subject || '-'}
              </TableCell>
              <TableCell>
                <Badge variant={statusVariants[log.status]}>
                  {automationStatusLabels[log.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
