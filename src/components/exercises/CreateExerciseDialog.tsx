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
import { useCreateExercise, useUpdateExercise, muscleGroups, type Exercise } from '@/hooks/useExercises';
import { Dumbbell, Video, Image } from 'lucide-react';

interface CreateExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editExercise?: Exercise | null;
}

export function CreateExerciseDialog({ open, onOpenChange, editExercise }: CreateExerciseDialogProps) {
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  
  const [formData, setFormData] = useState({
    name: editExercise?.name || '',
    description: editExercise?.description || '',
    muscle_group: editExercise?.muscle_group || '',
    video_url: editExercise?.video_url || '',
    image_url: editExercise?.image_url || '',
  });

  // Reset form when editExercise changes
  useState(() => {
    if (editExercise) {
      setFormData({
        name: editExercise.name,
        description: editExercise.description || '',
        muscle_group: editExercise.muscle_group || '',
        video_url: editExercise.video_url || '',
        image_url: editExercise.image_url || '',
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editExercise) {
      await updateExercise.mutateAsync({
        id: editExercise.id,
        name: formData.name,
        description: formData.description || null,
        muscle_group: formData.muscle_group || null,
        video_url: formData.video_url || null,
        image_url: formData.image_url || null,
      });
    } else {
      await createExercise.mutateAsync({
        name: formData.name,
        description: formData.description || undefined,
        muscle_group: formData.muscle_group || undefined,
        video_url: formData.video_url || undefined,
        image_url: formData.image_url || undefined,
      });
    }

    onOpenChange(false);
    setFormData({
      name: '',
      description: '',
      muscle_group: '',
      video_url: '',
      image_url: '',
    });
  };

  const isLoading = createExercise.isPending || updateExercise.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            {editExercise ? 'Editar Exercício' : 'Novo Exercício'}
          </DialogTitle>
          <DialogDescription>
            {editExercise 
              ? 'Atualize as informações do exercício.'
              : 'Adicione um novo exercício ao banco de exercícios.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Exercício *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Supino Reto com Barra"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="muscle_group">Grupo Muscular</Label>
            <Select 
              value={formData.muscle_group} 
              onValueChange={(v) => setFormData({ ...formData, muscle_group: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grupo muscular" />
              </SelectTrigger>
              <SelectContent>
                {muscleGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição / Instruções</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva como executar o exercício corretamente..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              URL do Vídeo (YouTube)
            </Label>
            <Input
              id="video_url"
              type="url"
              value={formData.video_url}
              onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              URL da Imagem
            </Label>
            <Input
              id="image_url"
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : editExercise ? 'Salvar' : 'Criar Exercício'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
