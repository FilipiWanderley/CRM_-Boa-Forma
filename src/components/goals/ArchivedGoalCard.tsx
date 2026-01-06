import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, DollarSign, UserCheck, Activity, RotateCcw, Trash2 } from 'lucide-react';
import { Goal, useGoals } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ArchivedGoalCardProps {
  goal: Goal;
}

const typeIcons = {
  leads: Users,
  conversions: UserCheck,
  revenue: DollarSign,
  check_ins: Activity,
  new_clients: Users,
};

const typeLabels = {
  leads: 'Leads',
  conversions: 'Conversões',
  revenue: 'Receita',
  check_ins: 'Check-ins',
  new_clients: 'Novos Clientes',
};

const periodLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function ArchivedGoalCard({ goal }: ArchivedGoalCardProps) {
  const { restoreGoal, deleteGoal } = useGoals();
  const Icon = typeIcons[goal.type];

  const formatValue = (value: number) => {
    if (goal.type === 'revenue') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  const progress = goal.target_value > 0 
    ? Math.min((goal.current_value / goal.target_value) * 100, 100) 
    : 0;

  const handleRestore = () => {
    restoreGoal.mutate(goal.id);
  };

  const handleDelete = () => {
    if (confirm('Tem certeza que deseja excluir permanentemente esta meta?')) {
      deleteGoal.mutate(goal.id);
    }
  };

  return (
    <Card className="bg-card/50 border-border/30 opacity-75 hover:opacity-100 transition-opacity">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-muted">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-medium text-sm text-foreground">{goal.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{typeLabels[goal.type]}</span>
                <span>•</span>
                <span>{periodLabels[goal.period_type]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              onClick={handleRestore}
              title="Restaurar meta"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
              title="Excluir permanentemente"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-end justify-between text-sm">
            <span className="text-muted-foreground">
              {formatValue(goal.current_value)} de {formatValue(goal.target_value)}
            </span>
            <span className="font-medium text-muted-foreground">
              {progress.toFixed(0)}%
            </span>
          </div>

          <Progress value={progress} className="h-1.5" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {format(new Date(goal.period_start), "dd MMM", { locale: ptBR })} - {format(new Date(goal.period_end), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
