import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, addMinutes, parse } from 'date-fns';
import { useClassTypes, useCreateClassSession } from '@/hooks/useClasses';
import { useUsers } from '@/hooks/useUsers';

interface CreateClassSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitId: string;
  preSelectedDate?: Date;
}

export function CreateClassSessionDialog({ 
  open, 
  onOpenChange, 
  unitId,
  preSelectedDate,
}: CreateClassSessionDialogProps) {
  const { data: classTypes } = useClassTypes();
  const { users } = useUsers();
  const createSession = useCreateClassSession();
  
  const professors = users?.filter(u => u.roles?.some(r => r.role === 'professor')) || [];

  const [formData, setFormData] = useState({
    class_type_id: '',
    professor_id: '',
    session_date: preSelectedDate ? format(preSelectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    start_time: '08:00',
    end_time: '09:00',
    location: '',
    max_capacity: 20,
    notes: '',
  });

  const selectedClassType = classTypes?.find(ct => ct.id === formData.class_type_id);

  // Auto-calculate end time based on class type duration
  const handleClassTypeChange = (classTypeId: string) => {
    const classType = classTypes?.find(ct => ct.id === classTypeId);
    if (classType) {
      const startTime = parse(formData.start_time, 'HH:mm', new Date());
      const endTime = addMinutes(startTime, classType.duration_minutes);
      setFormData({
        ...formData,
        class_type_id: classTypeId,
        end_time: format(endTime, 'HH:mm'),
        max_capacity: classType.max_capacity,
      });
    } else {
      setFormData({ ...formData, class_type_id: classTypeId });
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    if (selectedClassType) {
      const start = parse(startTime, 'HH:mm', new Date());
      const endTime = addMinutes(start, selectedClassType.duration_minutes);
      setFormData({
        ...formData,
        start_time: startTime,
        end_time: format(endTime, 'HH:mm'),
      });
    } else {
      setFormData({ ...formData, start_time: startTime });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createSession.mutateAsync({
      unit_id: unitId,
      class_type_id: formData.class_type_id,
      class_schedule_id: null,
      professor_id: formData.professor_id || null,
      session_date: formData.session_date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      max_capacity: formData.max_capacity,
      status: 'scheduled',
      location: formData.location || null,
      notes: formData.notes || null,
      cancelled_reason: null,
    });
    onOpenChange(false);
    setFormData({
      class_type_id: '',
      professor_id: '',
      session_date: format(new Date(), 'yyyy-MM-dd'),
      start_time: '08:00',
      end_time: '09:00',
      location: '',
      max_capacity: 20,
      notes: '',
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Aula</DialogTitle>
          <DialogDescription>
            Crie uma sessão de aula coletiva
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Modalidade *</Label>
            <Select
              value={formData.class_type_id}
              onValueChange={handleClassTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a modalidade" />
              </SelectTrigger>
              <SelectContent>
                {classTypes?.filter(ct => ct.is_active).map((ct) => (
                  <SelectItem key={ct.id} value={ct.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ct.color }} />
                      {ct.name} ({ct.duration_minutes} min)
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data *</Label>
            <Input
              type="date"
              value={formData.session_date}
              onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário Início *</Label>
              <Input
                type="time"
                value={formData.start_time}
                onChange={(e) => handleStartTimeChange(e.target.value)}
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
              <Label>Capacidade *</Label>
              <Input
                type="number"
                min={1}
                value={formData.max_capacity}
                onChange={(e) => setFormData({ ...formData, max_capacity: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a aula..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createSession.isPending || !formData.class_type_id}>
              {createSession.isPending ? 'Criando...' : 'Criar Aula'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
