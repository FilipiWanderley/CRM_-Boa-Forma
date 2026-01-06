import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  useProfessorAvailability, 
  useCreateAvailability, 
  useDeleteAvailability,
  dayOfWeekLabels 
} from '@/hooks/useScheduling';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Trash2, Clock, User } from 'lucide-react';

interface ProfessorAvailabilityManagerProps {
  unitId: string;
}

export function ProfessorAvailabilityManager({ unitId }: ProfessorAvailabilityManagerProps) {
  const { profile, hasRole } = useAuth();
  const { users } = useUsers();
  const isGestor = hasRole('gestor');
  const isProfessor = hasRole('professor');

  const [selectedProfessor, setSelectedProfessor] = useState<string>(
    isProfessor && !isGestor ? profile?.user_id || '' : ''
  );
  const [newDayOfWeek, setNewDayOfWeek] = useState('1');
  const [newStartTime, setNewStartTime] = useState('08:00');
  const [newEndTime, setNewEndTime] = useState('18:00');

  const professors = users?.filter(u => u.roles?.some(r => r.role === 'professor')) || [];
  
  const { data: availability, isLoading } = useProfessorAvailability(selectedProfessor || undefined);
  const createAvailability = useCreateAvailability();
  const deleteAvailability = useDeleteAvailability();

  const handleAddAvailability = async () => {
    const professorId = selectedProfessor || (isProfessor ? profile?.user_id : null);
    if (!professorId) return;

    await createAvailability.mutateAsync({
      unit_id: unitId,
      professor_id: professorId,
      day_of_week: parseInt(newDayOfWeek),
      start_time: newStartTime,
      end_time: newEndTime,
      is_active: true,
    });
  };

  const handleDeleteAvailability = async (id: string) => {
    await deleteAvailability.mutateAsync(id);
  };

  // Group availability by day
  const availabilityByDay = availability?.reduce((acc, item) => {
    const day = item.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(item);
    return acc;
  }, {} as Record<number, typeof availability>);

  return (
    <div className="space-y-6">
      {/* Professor Selector (only for gestor) */}
      {isGestor && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Selecionar Professor
            </CardTitle>
            <CardDescription>
              Escolha o professor para gerenciar a disponibilidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedProfessor} onValueChange={setSelectedProfessor}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um professor" />
              </SelectTrigger>
              <SelectContent>
                {professors.map((prof) => (
                  <SelectItem key={prof.id} value={prof.user_id}>
                    {prof.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Add New Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Horário
          </CardTitle>
          <CardDescription>
            Defina os horários de disponibilidade semanal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Dia da Semana</Label>
              <Select value={newDayOfWeek} onValueChange={setNewDayOfWeek}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {dayOfWeekLabels.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Início</Label>
              <Input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Término</Label>
              <Input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleAddAvailability}
                disabled={createAvailability.isPending || (!selectedProfessor && !isProfessor)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Availability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Horários Cadastrados
          </CardTitle>
          <CardDescription>
            {selectedProfessor || isProfessor
              ? 'Disponibilidade semanal do professor'
              : 'Selecione um professor para ver os horários'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !availability?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum horário cadastrado
            </div>
          ) : (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
                const dayAvailability = availabilityByDay?.[dayIndex];
                if (!dayAvailability?.length) return null;

                return (
                  <div key={dayIndex} className="flex items-start gap-4 pb-4 border-b border-border last:border-0">
                    <Badge variant="outline" className="min-w-[100px] justify-center">
                      {dayOfWeekLabels[dayIndex]}
                    </Badge>
                    <div className="flex flex-wrap gap-2">
                      {dayAvailability.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg"
                        >
                          <Clock className="h-3 w-3 text-primary" />
                          <span className="text-sm">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteAvailability(slot.id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
