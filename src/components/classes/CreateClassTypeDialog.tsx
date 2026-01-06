import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateClassType } from '@/hooks/useClasses';

const colorOptions = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
];

interface CreateClassTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
}

export function CreateClassTypeDialog({ open, onOpenChange, unitId }: CreateClassTypeDialogProps) {
  const createClassType = useCreateClassType();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    max_capacity: 20,
    color: '#3B82F6',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createClassType.mutateAsync({
      ...formData,
      unit_id: unitId,
      is_active: true,
    });
    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      max_capacity: 20,
      color: '#3B82F6',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Modalidade</DialogTitle>
          <DialogDescription>
            Crie um tipo de aula coletiva (ex: Yoga, Spinning, Natação)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Modalidade *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Yoga, Spinning, Natação..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição da modalidade..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos)</Label>
              <Input
                id="duration"
                type="number"
                min={15}
                max={180}
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacidade máxima</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                max={100}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor</Label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formData.color === color ? 'border-foreground scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createClassType.isPending || !formData.name}>
              {createClassType.isPending ? 'Criando...' : 'Criar Modalidade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
