import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateWorkout } from '@/hooks/useWorkouts';
import { useLeads } from '@/hooks/useLeads';
import { useAuth } from '@/hooks/useAuth';
import { ClipboardList, User } from 'lucide-react';

interface CreateWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedLeadId?: string;
  onSuccess?: (workoutId: string) => void;
}

export function CreateWorkoutDialog({ 
  open, 
  onOpenChange, 
  preselectedLeadId,
  onSuccess 
}: CreateWorkoutDialogProps) {
  const { profile } = useAuth();
  const createWorkout = useCreateWorkout();
  const { data: leads } = useLeads(); // Get all leads, not just 'ativo'
  
  const [formData, setFormData] = useState({
    lead_id: preselectedLeadId || '',
    name: '',
    description: '',
    valid_from: '',
    valid_until: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.unit_id || !formData.lead_id) return;

    const result = await createWorkout.mutateAsync({
      unit_id: profile.unit_id,
      lead_id: formData.lead_id,
      name: formData.name,
      description: formData.description || undefined,
      valid_from: formData.valid_from || undefined,
      valid_until: formData.valid_until || undefined,
    });

    onOpenChange(false);
    setFormData({
      lead_id: '',
      name: '',
      description: '',
      valid_from: '',
      valid_until: '',
    });

    if (onSuccess && result?.id) {
      onSuccess(result.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Nova Ficha de Treino
          </DialogTitle>
          <DialogDescription>
            Crie uma nova ficha de treino para um aluno.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead_id">Aluno *</Label>
            <Select 
              value={formData.lead_id} 
              onValueChange={(v) => setFormData({ ...formData, lead_id: v })}
              disabled={!!preselectedLeadId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o aluno" />
              </SelectTrigger>
              <SelectContent>
                {!leads?.length && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    Nenhum aluno cadastrado
                  </div>
                )}
                {leads?.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome da Ficha *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Treino A - Peito e Tríceps"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição / Objetivo</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Objetivo do treino, observações..."
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="valid_from">Válido a partir de</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valid_until">Válido até</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createWorkout.isPending}>
              {createWorkout.isPending ? 'Criando...' : 'Criar Ficha'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
