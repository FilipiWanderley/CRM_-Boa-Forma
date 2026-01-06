import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useClassTypes, useCreateClassSchedule, dayOfWeekLabels } from '@/hooks/useClasses';
import { useUsers } from '@/hooks/useUsers';

interface CreateClassScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
}

export function CreateClassScheduleDialog({ open, onOpenChange, unitId }: CreateClassScheduleDialogProps) {
  const { data: classTypes } = useClassTypes();
  const { users } = useUsers();
  const createSchedule = useCreateClassSchedule();
  
  const professors = users?.filter(u => u.roles?.some(r => r.role === 'professor')) || [];

  const [formData, setFormData] = useState({
    class_type_id: '',
    professor_id: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '09:00',
    location: '',
    max_capacity: undefined as number | undefined,
  });

  const selectedClassType = classTypes?.find(ct => ct.id === formData.class_type_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSchedule.mutateAsync({
      unit_id: unitId,
      class_type_id: formData.class_type_id,
      professor_id: formData.professor_id || null,
      day_of_week: formData.day_of_week,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location || null,
      max_capacity: formData.max_capacity || null,
      is_active: true,
    });
    onOpenChange(false);
    setFormData({
      class_type_id: '',
      professor_id: '',
      day_of_week: 1,
      start_time: '08:00',
      end_time: '09:00',
      location: '',
      max_capacity: undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Horário de Aula</DialogTitle>
          <DialogDescription>
            Configure um horário recorrente para aulas coletivas
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Modalidade *</Label>
            <Select
              value={formData.class_type_id}
              onValueChange={(value) => setFormData({ ...formData, class_type_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {classTypes?.filter(ct => ct.is_active).map((ct) => (
                  <SelectItem key={ct.id} value={ct.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color }} />
                      {ct.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Professor</Label>
            <Select
              value={formData.professor_id}
              onValueChange={(value) => setFormData({ ...formData, professor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o professor (opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                {professors.map((prof) => (
                  <SelectItem key={prof.id} value={prof.id}>
                    {prof.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dia da Semana *</Label>
            <Select
              value={String(formData.day_of_week)}
              onValueChange={(value) => setFormData({ ...formData, day_of_week: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dayOfWeekLabels.map((day, index) => (
                  <SelectItem key={index} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Início *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Horário Fim *</Label>
              <Input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Ex: Sala 1, Piscina..."
              />
            </div>
            <div className="space-y-2">
              <Label>Capacidade</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_capacity || ''}
                onChange={(e) => setFormData({ ...formData, max_capacity: e.target.value ? Number(e.target.value) : undefined })}
                placeholder={selectedClassType ? String(selectedClassType.max_capacity) : 'Padrão'}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSchedule.isPending || !formData.class_type_id}>
              {createSchedule.isPending ? 'Criando...' : 'Criar Horário'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
