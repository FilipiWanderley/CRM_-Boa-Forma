import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useCreatePlan, useUpdatePlan, type Plan } from '@/hooks/useFinancial';
import { Loader2, Plus, X } from 'lucide-react';

interface CreatePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  editingPlan?: Plan | null;
}

export function CreatePlanDialog({ open, onOpenChange, unitId, editingPlan }: CreatePlanDialogProps) {
  const [name, setName] = useState(editingPlan?.name || '');
  const [description, setDescription] = useState(editingPlan?.description || '');
  const [price, setPrice] = useState(editingPlan?.price?.toString() || '');
  const [durationDays, setDurationDays] = useState(editingPlan?.duration_days?.toString() || '30');
  const [isActive, setIsActive] = useState(editingPlan?.is_active ?? true);
  const [features, setFeatures] = useState<string[]>(editingPlan?.features || []);
  const [newFeature, setNewFeature] = useState('');

  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const planData = {
      unit_id: unitId,
      name,
      description: description || null,
      price: parseFloat(price),
      duration_days: parseInt(durationDays),
      is_active: isActive,
      features: features.length > 0 ? features : null,
    };

    if (editingPlan) {
      await updatePlan.mutateAsync({ id: editingPlan.id, ...planData });
    } else {
      await createPlan.mutateAsync(planData);
    }
    
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setDurationDays('30');
    setIsActive(true);
    setFeatures([]);
    setNewFeature('');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const isPending = createPlan.isPending || updatePlan.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingPlan ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          <DialogDescription>
            {editingPlan ? 'Atualize as informações do plano' : 'Configure um novo plano de mensalidade'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Plano</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Mensal, Trimestral, Anual"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Valor (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="99.90"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (dias)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do plano..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Benefícios</Label>
            <div className="flex gap-2">
              <Input
                value={newFeature}
                onChange={(e) => setNewFeature(e.target.value)}
                placeholder="Adicionar benefício..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addFeature}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {features.length > 0 && (
              <ul className="space-y-1 mt-2">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between text-sm bg-secondary/50 rounded px-2 py-1">
                    <span>{feature}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="active">Plano ativo</Label>
            <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPlan ? 'Salvar' : 'Criar Plano'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
