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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useExercises, muscleGroups, type Exercise } from '@/hooks/useExercises';
import { useAddExerciseToWorkout } from '@/hooks/useWorkouts';
import { ExerciseCard } from '@/components/exercises/ExerciseCard';
import { Dumbbell, Search, Plus } from 'lucide-react';

interface AddExerciseToWorkoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutId: string;
  currentExercisesCount: number;
}

export function AddExerciseToWorkoutDialog({ 
  open, 
  onOpenChange, 
  workoutId,
  currentExercisesCount 
}: AddExerciseToWorkoutDialogProps) {
  const [tab, setTab] = useState<'library' | 'custom'>('library');
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  
  const [formData, setFormData] = useState({
    exercise_name: '',
    sets: 3,
    reps: '12',
    rest_seconds: 60,
    notes: '',
  });

  const { data: exercises, isLoading } = useExercises();
  const addExercise = useAddExerciseToWorkout();

  const filteredExercises = exercises?.filter((e) => {
    const matchesSearch = !search || 
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.muscle_group?.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle = !selectedMuscle || e.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  const handleSelectExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormData({ ...formData, exercise_name: exercise.name });
    setTab('custom'); // Move to custom tab to set details
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await addExercise.mutateAsync({
      workout_id: workoutId,
      exercise_name: formData.exercise_name,
      sets: formData.sets,
      reps: formData.reps,
      rest_seconds: formData.rest_seconds || undefined,
      notes: formData.notes || undefined,
      order_index: currentExercisesCount,
    });

    onOpenChange(false);
    setFormData({
      exercise_name: '',
      sets: 3,
      reps: '12',
      rest_seconds: 60,
      notes: '',
    });
    setSelectedExercise(null);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Exercício
          </DialogTitle>
          <DialogDescription>
            Selecione do banco ou crie um exercício personalizado.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as 'library' | 'custom')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Banco de Exercícios</TabsTrigger>
            <TabsTrigger value="custom">Personalizado</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar exercício..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Muscle Filter */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedMuscle === null ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedMuscle(null)}
              >
                Todos
              </Badge>
              {muscleGroups.slice(0, 8).map((group) => (
                <Badge
                  key={group}
                  variant={selectedMuscle === group ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setSelectedMuscle(group)}
                >
                  {group}
                </Badge>
              ))}
            </div>

            {/* Exercise List */}
            <ScrollArea className="h-[300px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando exercícios...
                </div>
              ) : filteredExercises && filteredExercises.length > 0 ? (
                <div className="grid gap-2">
                  {filteredExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      selectable
                      onSelect={handleSelectExercise}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum exercício encontrado.</p>
                  <p className="text-sm">Crie um exercício personalizado.</p>
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise_name">Nome do Exercício *</Label>
                <Input
                  id="exercise_name"
                  value={formData.exercise_name}
                  onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
                  placeholder="Ex: Supino Reto com Barra"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="sets">Séries *</Label>
                  <Input
                    id="sets"
                    type="number"
                    min={1}
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 3 })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Repetições *</Label>
                  <Input
                    id="reps"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                    placeholder="12, 10-12, até falha"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rest_seconds">Descanso (seg)</Label>
                  <Input
                    id="rest_seconds"
                    type="number"
                    min={0}
                    value={formData.rest_seconds}
                    onChange={(e) => setFormData({ ...formData, rest_seconds: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instruções específicas, variações..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={addExercise.isPending}>
                  {addExercise.isPending ? 'Adicionando...' : 'Adicionar Exercício'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
