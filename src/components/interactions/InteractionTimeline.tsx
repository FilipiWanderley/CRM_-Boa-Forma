import { useInteractions, getInteractionTypeLabel, type InteractionType } from '@/hooks/useInteractions';
import { Skeleton } from '@/components/ui/skeleton';
import { Phone, MessageCircle, Mail, User, Bot, Calendar, CheckCircle2 } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface InteractionTimelineProps {
  leadId: string;
}

const typeConfig: Record<InteractionType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  ligacao: { 
    icon: <Phone className="h-4 w-4" />, 
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  whatsapp: { 
    icon: <MessageCircle className="h-4 w-4" />, 
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  email: { 
    icon: <Mail className="h-4 w-4" />, 
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  presencial: { 
    icon: <User className="h-4 w-4" />, 
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  sistema: { 
    icon: <Bot className="h-4 w-4" />, 
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

export function InteractionTimeline({ leadId }: InteractionTimelineProps) {
  const { data: interactions, isLoading } = useInteractions(leadId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!interactions || interactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
        <p className="text-sm">Nenhuma interação registrada</p>
        <p className="text-xs">Registre a primeira interação com este lead</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

      <div className="space-y-6">
        {interactions.map((interaction, index) => {
          const config = typeConfig[interaction.type];
          const isLast = index === interactions.length - 1;

          return (
            <div key={interaction.id} className="relative flex gap-4">
              {/* Icon */}
              <div
                className={cn(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-background',
                  config.bgColor,
                  config.color
                )}
              >
                {config.icon}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn('text-sm font-medium', config.color)}>
                    {getInteractionTypeLabel(interaction.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(interaction.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </span>
                </div>

                <div className="rounded-lg bg-secondary/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{interaction.description}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(interaction.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </span>
                    {interaction.completed_at && (
                      <span className="flex items-center gap-1 text-success">
                        <CheckCircle2 className="h-3 w-3" />
                        Concluída
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
