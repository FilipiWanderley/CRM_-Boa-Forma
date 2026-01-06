import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, 
  Users, 
  Clock,
  Trash2,
  Settings
} from 'lucide-react';
import { useClassTypes, useClassSchedules, useDeleteClassSchedule, dayOfWeekLabels, useDeleteClassType } from '@/hooks/useClasses';
import { CreateClassTypeDialog } from './CreateClassTypeDialog';
import { CreateClassScheduleDialog } from './CreateClassScheduleDialog';

interface ClassTypesManagerProps {
  unitId: string;
}

export function ClassTypesManager({ unitId }: ClassTypesManagerProps) {
  const { data: classTypes, isLoading: typesLoading } = useClassTypes();
  const { data: schedules, isLoading: schedulesLoading } = useClassSchedules();
  const deleteClassType = useDeleteClassType();
  const deleteSchedule = useDeleteClassSchedule();
  
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false);

  const isLoading = typesLoading || schedulesLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Class Types Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Modalidades</h3>
            <p className="text-sm text-muted-foreground">Tipos de aulas oferecidas</p>
          </div>
          <Button onClick={() => setCreateTypeOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Modalidade
          </Button>
        </div>

        {classTypes?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma modalidade cadastrada</p>
              <Button variant="outline" className="mt-4" onClick={() => setCreateTypeOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira modalidade
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {classTypes?.map((type) => (
              <Card key={type.id} className="relative overflow-hidden">
                <div 
                  className="absolute top-0 left-0 w-1 h-full"
                  style={{ backgroundColor: type.color }}
                />
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => deleteClassType.mutate(type.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {type.description && (
                    <CardDescription>{type.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {type.duration_minutes} min
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {type.max_capacity} vagas
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Schedules Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Horários Recorrentes</h3>
            <p className="text-sm text-muted-foreground">Grade de aulas semanais</p>
          </div>
          <Button onClick={() => setCreateScheduleOpen(true)} disabled={!classTypes?.length}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Horário
          </Button>
        </div>

        {schedules?.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum horário configurado</p>
              {classTypes?.length ? (
                <Button variant="outline" className="mt-4" onClick={() => setCreateScheduleOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Configurar horários
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Primeiro crie uma modalidade
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {dayOfWeekLabels.map((dayLabel, dayIndex) => {
              const daySchedules = schedules?.filter(s => s.day_of_week === dayIndex) || [];
              if (daySchedules.length === 0) return null;
              
              return (
                <Card key={dayIndex}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{dayLabel}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {daySchedules.map((schedule) => (
                        <Badge 
                          key={schedule.id} 
                          variant="secondary"
                          className="flex items-center gap-2 py-1.5 px-3"
                          style={{ borderLeftColor: schedule.class_type?.color, borderLeftWidth: 3 }}
                        >
                          <span className="font-medium">{schedule.class_type?.name}</span>
                          <span className="text-muted-foreground">
                            {schedule.start_time.slice(0, 5)} - {schedule.end_time.slice(0, 5)}
                          </span>
                          {schedule.professor && (
                            <span className="text-muted-foreground">
                              • {schedule.professor.full_name}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5 ml-1 text-destructive hover:text-destructive"
                            onClick={() => deleteSchedule.mutate(schedule.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateClassTypeDialog
        open={createTypeOpen}
        onOpenChange={setCreateTypeOpen}
        unitId={unitId}
      />
      <CreateClassScheduleDialog
        open={createScheduleOpen}
        onOpenChange={setCreateScheduleOpen}
        unitId={unitId}
      />
    </div>
  );
}
