import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, AlertTriangle, CheckCircle2, Archive, Users, DollarSign, UserCheck, Activity, Pencil } from 'lucide-react';
import { GoalWithProgress, useGoals } from '@/hooks/useGoals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { EditGoalDialog } from './EditGoalDialog';

interface GoalCardProps {
  goal: GoalWithProgress;
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

const statusConfig = {
  completed: { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', label: 'Concluída' },
  on_track: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', label: 'No caminho' },
  at_risk: { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10', label: 'Atenção' },
  behind: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Atrasada' },
};

const periodLabels = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export function GoalCard({ goal }: GoalCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const { archiveGoal } = useGoals();
  const Icon = typeIcons[goal.type];
  const status = statusConfig[goal.status];
  const StatusIcon = status.icon;

  const formatValue = (value: number) => {
    if (goal.type === 'revenue') {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  const handleArchive = () => {
    if (confirm('Tem certeza que deseja arquivar esta meta?')) {
      archiveGoal.mutate(goal.id);
    }
  };

  return (
    <Card className="bg-card border-border/50 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${status.bg}`}>
              <Icon className={`h-5 w-5 ${status.color}`} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{goal.name}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{typeLabels[goal.type]}</span>
                <span>•</span>
                <span>{periodLabels[goal.period_type]}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              <StatusIcon className="h-3 w-3" />
              {status.label}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-amber-500"
              onClick={handleArchive}
              title="Arquivar meta"
            >
              <Archive className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">
                {formatValue(goal.current_value)}
              </p>
              <p className="text-sm text-muted-foreground">
                de {formatValue(goal.target_value)}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${status.color}`}>
                {goal.progress.toFixed(0)}%
              </p>
            </div>
          </div>

          <Progress value={goal.progress} className="h-2" />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {format(new Date(goal.period_start), "dd MMM", { locale: ptBR })}
            </span>
            <span>
              {format(new Date(goal.period_end), "dd MMM yyyy", { locale: ptBR })}
            </span>
          </div>
        </div>
      </CardContent>
      <EditGoalDialog goal={goal} open={editOpen} onOpenChange={setEditOpen} />
    </Card>
  );
}
