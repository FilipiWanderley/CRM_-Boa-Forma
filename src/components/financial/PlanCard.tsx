import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, Edit, Package } from 'lucide-react';
import type { Plan } from '@/hooks/useFinancial';

interface PlanCardProps {
  plan: Plan;
  onEdit?: (plan: Plan) => void;
}

export function PlanCard({ plan, onEdit }: PlanCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <Card className={`card-glow relative ${!plan.is_active ? 'opacity-60' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <CardDescription>
                {plan.duration_days} dias
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={plan.is_active ? 'default' : 'secondary'}>
              {plan.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            {onEdit && (
              <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary mb-4">
          {formatCurrency(Number(plan.price))}
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        </div>
        
        {plan.description && (
          <p className="text-sm text-muted-foreground mb-4">
            {plan.description}
          </p>
        )}

        {plan.features && plan.features.length > 0 && (
          <ul className="space-y-2">
            {plan.features.map((feature, index) => (
              <li key={index} className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-success" />
                {feature}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
