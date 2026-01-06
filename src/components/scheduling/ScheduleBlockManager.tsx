import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useScheduleBlocks } from '@/hooks/useScheduling';
import { useUsers } from '@/hooks/useUsers';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Calendar as CalendarIcon, Ban, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduleBlockManagerProps {
  unitId: string;
}

export function ScheduleBlockManager({ unitId }: ScheduleBlockManagerProps) {
  const { hasRole } = useAuth();
  const { users } = useUsers();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isGestor = hasRole('gestor');

  const [blockDate, setBlockDate] = useState<Date | undefined>(new Date());
  const [professorId, setProfessorId] = useState('');
  const [allDay, setAllDay] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [reason, setReason] = useState('');

  const professors = users?.filter(u => u.roles?.some(r => r.role === 'professor')) || [];
  const { data: blocks, isLoading } = useScheduleBlocks();

  const handleAddBlock = async () => {
    if (!blockDate) return;

    try {
      const { error } = await supabase.from('schedule_blocks').insert({
        unit_id: unitId,
        professor_id: professorId === 'all' ? null : professorId || null,
        block_date: format(blockDate, 'yyyy-MM-dd'),
        all_day: allDay,
        start_time: allDay ? null : startTime,
        end_time: allDay ? null : endTime,
        reason: reason || null,
      });

      if (error) throw error;

      toast({ title: 'Bloqueio adicionado' });
      queryClient.invalidateQueries({ queryKey: ['schedule-blocks'] });
      setReason('');
    } catch (error: any) {
      toast({ title: 'Erro ao adicionar bloqueio', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      const { error } = await supabase.from('schedule_blocks').delete().eq('id', id);
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['schedule-blocks'] });
      toast({ title: 'Bloqueio removido' });
    } catch (error: any) {
      toast({ title: 'Erro ao remover', description: error.message, variant: 'destructive' });
    }
  };

  const getProfessorName = (profId: string | null) => {
    if (!profId) return 'Todos os Professores';
    const prof = professors.find(p => p.user_id === profId);
    return prof?.full_name || 'Professor';
  };

  // Filter only future blocks
  const futureBlocks = blocks?.filter(b => new Date(b.block_date) >= new Date(new Date().setHours(0, 0, 0, 0))) || [];

  return (
    <div className="space-y-6">
      {/* Add New Block */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ban className="h-5 w-5 text-primary" />
            Adicionar Bloqueio
          </CardTitle>
          <CardDescription>
            Bloqueie datas ou horários específicos na agenda
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {isGestor && (
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select value={professorId} onValueChange={setProfessorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Professores</SelectItem>
                    {professors.map((prof) => (
                      <SelectItem key={prof.id} value={prof.user_id}>
                        {prof.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !blockDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {blockDate ? format(blockDate, "PPP", { locale: ptBR }) : 'Selecione'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={blockDate}
                    onSelect={setBlockDate}
                    locale={ptBR}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="all-day" checked={allDay} onCheckedChange={setAllDay} />
            <Label htmlFor="all-day">Dia inteiro</Label>
          </div>

          {!allDay && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Término</Label>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input
              placeholder="Ex: Feriado, Férias, etc."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Button onClick={handleAddBlock} disabled={!blockDate} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Bloqueio
          </Button>
        </CardContent>
      </Card>

      {/* Current Blocks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Bloqueios Agendados
          </CardTitle>
          <CardDescription>
            {futureBlocks.length} bloqueio{futureBlocks.length !== 1 ? 's' : ''} futuro{futureBlocks.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : !futureBlocks.length ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum bloqueio futuro cadastrado
            </div>
          ) : (
            <div className="space-y-3">
              {futureBlocks.map((block) => (
                <div
                  key={block.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-destructive/10">
                      <Ban className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {format(new Date(block.block_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getProfessorName(block.professor_id)}
                        </Badge>
                        {block.all_day ? (
                          <span>Dia inteiro</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {block.start_time?.slice(0, 5)} - {block.end_time?.slice(0, 5)}
                          </span>
                        )}
                        {block.reason && (
                          <span className="text-primary">• {block.reason}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteBlock(block.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
