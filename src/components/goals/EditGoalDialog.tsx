import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGoals, GoalWithProgress, Goal } from '@/hooks/useGoals';

const goalTypes: { value: Goal['type']; label: string }[] = [
  { value: 'leads', label: 'Novos Leads' },
  { value: 'conversions', label: 'Conversões' },
  { value: 'revenue', label: 'Receita (R$)' },
  { value: 'check_ins', label: 'Check-ins' },
  { value: 'new_clients', label: 'Novos Clientes' },
];

const periodTypes: { value: Goal['period_type']; label: string }[] = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'yearly', label: 'Anual' },
];

interface EditGoalDialogProps {
  goal: GoalWithProgress;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditGoalDialog({ goal, open, onOpenChange }: EditGoalDialogProps) {
  const { updateGoal } = useGoals();
  const [formData, setFormData] = useState({
    name: goal.name,
    type: goal.type,
    target_value: goal.target_value,
    period_type: goal.period_type,
    period_start: goal.period_start,
    period_end: goal.period_end,
  });

  useEffect(() => {
    setFormData({
      name: goal.name,
      type: goal.type,
      target_value: goal.target_value,
      period_type: goal.period_type,
      period_start: goal.period_start,
      period_end: goal.period_end,
    });
  }, [goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGoal.mutateAsync({ id: goal.id, ...formData });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Meta</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Meta de leads do mês"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as Goal['type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="target">Valor Alvo</Label>
            <Input
              id="target"
              type="number"
              min="1"
              value={formData.target_value || ''}
              onChange={(e) => setFormData({ ...formData, target_value: Number(e.target.value) })}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="period">Período</Label>
            <Select
              value={formData.period_type}
              onValueChange={(value) => setFormData({ ...formData, period_type: value as Goal['period_type'] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodTypes.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period_start">Data Início</Label>
              <Input
                id="period_start"
                type="date"
                value={formData.period_start}
                onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="period_end">Data Fim</Label>
              <Input
                id="period_end"
                type="date"
                value={formData.period_end}
                onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateGoal.isPending}>
              {updateGoal.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
