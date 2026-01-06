import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Check, X, Clock, User, Phone } from 'lucide-react';
import { 
  type Appointment, 
  appointmentTypeLabels, 
  appointmentStatusLabels,
  useUpdateAppointment,
  useCancelAppointment 
} from '@/hooks/useScheduling';

interface AppointmentCardProps {
  appointment: Appointment;
  compact?: boolean;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  confirmed: 'bg-success/10 text-success border-success/20',
  completed: 'bg-primary/10 text-primary border-primary/20',
  cancelled: 'bg-muted text-muted-foreground border-muted',
  no_show: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeColors: Record<string, string> = {
  aula_experimental: 'bg-purple-500/10 text-purple-500',
  avaliacao_fisica: 'bg-orange-500/10 text-orange-500',
  treino: 'bg-green-500/10 text-green-500',
  consulta: 'bg-blue-500/10 text-blue-500',
  outros: 'bg-gray-500/10 text-gray-500',
};

export function AppointmentCard({ appointment, compact = false }: AppointmentCardProps) {
  const updateAppointment = useUpdateAppointment();
  const cancelAppointment = useCancelAppointment();

  const handleConfirm = () => {
    updateAppointment.mutate({ id: appointment.id, status: 'confirmed' });
  };

  const handleComplete = () => {
    updateAppointment.mutate({ 
      id: appointment.id, 
      status: 'completed',
    });
  };

  const handleNoShow = () => {
    updateAppointment.mutate({ id: appointment.id, status: 'no_show' });
  };

  const handleCancel = () => {
    cancelAppointment.mutate({ id: appointment.id });
  };

  const isActionable = ['scheduled', 'confirmed'].includes(appointment.status);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${typeColors[appointment.type]}`}>
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="font-medium text-sm">{appointment.title}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}</span>
              {appointment.lead && (
                <>
                  <span>•</span>
                  <span>{appointment.lead.full_name}</span>
                </>
              )}
            </div>
          </div>
        </div>
        <Badge variant="outline" className={statusColors[appointment.status]}>
          {appointmentStatusLabels[appointment.status]}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="card-glow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-2 rounded-lg shrink-0 ${typeColors[appointment.type]}`}>
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-medium">{appointment.title}</h4>
                <Badge variant="outline" className={statusColors[appointment.status]}>
                  {appointmentStatusLabels[appointment.status]}
                </Badge>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {appointment.start_time.slice(0, 5)} - {appointment.end_time.slice(0, 5)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {appointmentTypeLabels[appointment.type]}
                </Badge>
              </div>

              {appointment.lead && (
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    {appointment.lead.full_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {appointment.lead.phone}
                  </span>
                </div>
              )}

              {appointment.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {appointment.description}
                </p>
              )}
            </div>
          </div>

          {isActionable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {appointment.status === 'scheduled' && (
                  <DropdownMenuItem onClick={handleConfirm}>
                    <Check className="h-4 w-4 mr-2 text-success" />
                    Confirmar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleComplete}>
                  <Check className="h-4 w-4 mr-2 text-primary" />
                  Marcar como Concluído
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleNoShow}>
                  <X className="h-4 w-4 mr-2 text-warning" />
                  Não Compareceu
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleCancel} className="text-destructive">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
