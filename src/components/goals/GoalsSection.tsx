import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Target } from 'lucide-react';
import { useGoals } from '@/hooks/useGoals';
import { GoalCard } from './GoalCard';
import { CreateGoalDialog } from './CreateGoalDialog';
import { GoalsHistoryDialog } from './GoalsHistoryDialog';

export function GoalsSection() {
  const { goals, isLoading } = useGoals();

  if (isLoading) {
    return (
      <Card className="bg-card border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Metas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-primary" />
          Metas do Período
        </CardTitle>
        <div className="flex items-center gap-2">
          <GoalsHistoryDialog />
          <CreateGoalDialog />
        </div>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Target className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              Nenhuma meta configurada
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Crie metas para acompanhar o desempenho da sua academia
            </p>
            <CreateGoalDialog />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
