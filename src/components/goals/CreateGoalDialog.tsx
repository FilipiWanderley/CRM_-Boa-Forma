import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useGoals, CreateGoalInput, Goal } from '@/hooks/useGoals';

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

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false);
  const { createGoal } = useGoals();
  const [formData, setFormData] = useState<CreateGoalInput>({
    name: '',
    type: 'leads',
    target_value: 0,
    period_type: 'monthly',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createGoal.mutateAsync(formData);
    setFormData({ name: '', type: 'leads', target_value: 0, period_type: 'monthly' });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Meta</DialogTitle>
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
              placeholder={formData.type === 'revenue' ? 'R$ 10000' : '100'}
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
          
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createGoal.isPending}>
              {createGoal.isPending ? 'Criando...' : 'Criar Meta'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
