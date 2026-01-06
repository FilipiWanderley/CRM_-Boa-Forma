import { Task, useToggleTask, useDeleteTask } from '@/hooks/useTasks';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trash2, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  showLeadLink?: boolean;
}

const priorityConfig = {
  low: { label: 'Baixa', className: 'bg-muted text-muted-foreground' },
  medium: { label: 'Média', className: 'bg-warning/20 text-warning' },
  high: { label: 'Alta', className: 'bg-destructive/20 text-destructive' },
};

export function TaskCard({ task, showLeadLink = true }: TaskCardProps) {
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.medium;
  
  const isOverdue = task.due_date && !task.is_completed && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg transition-all duration-200',
        task.is_completed 
          ? 'bg-secondary/30 opacity-60' 
          : 'bg-secondary/50 hover:bg-secondary/70',
        isOverdue && !task.is_completed && 'border border-destructive/50'
      )}
    >
      <Checkbox
        checked={task.is_completed || false}
        onCheckedChange={(checked) =>
          toggleTask.mutate({ id: task.id, is_completed: checked as boolean })
        }
        className="mt-1"
      />
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'font-medium',
            task.is_completed && 'line-through text-muted-foreground'
          )}>
            {task.title}
          </p>
          <Badge variant="secondary" className={cn('text-xs shrink-0', priority.className)}>
            {priority.label}
          </Badge>
        </div>
        
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.due_date && (
            <span className={cn(
              'text-xs flex items-center gap-1',
              isOverdue ? 'text-destructive' : isDueToday ? 'text-warning' : 'text-muted-foreground'
            )}>
              <Clock className="h-3 w-3" />
              {isOverdue && 'Atrasada: '}
              {isDueToday && 'Hoje: '}
              {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          )}
          
          {task.lead_id && showLeadLink && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Vinculada a lead
            </span>
          )}
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={() => deleteTask.mutate(task.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
