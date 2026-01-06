import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProfessorStudents } from '@/hooks/useProfessorStats';
import { usePhysicalAssessments, useCreateAssessment } from '@/hooks/usePhysicalAssessments';
import { useAuth } from '@/hooks/useAuth';
import { EvolutionCharts } from '@/components/assessments/EvolutionCharts';
import { 
  ClipboardList, 
  Plus, 
  User,
  Scale,
  Ruler,
  Activity,
  Calendar,
  Search,
  TrendingUp
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_UNIT_ID = 'a0000000-0000-0000-0000-000000000001';

export default function Avaliacoes() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: students, isLoading: studentsLoading } = useProfessorStudents();
  const createAssessment = useCreateAssessment();
  
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewDialog, setShowNewDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    chest: '',
    waist: '',
    hips: '',
    right_arm: '',
    left_arm: '',
    right_thigh: '',
    left_thigh: '',
    right_calf: '',
    left_calf: '',
    neck: '',
    notes: '',
  });

  // Get assessments for selected student
  const { data: assessments, isLoading: assessmentsLoading } = usePhysicalAssessments(selectedStudent || undefined);

  // Filter students
  const filteredStudents = students?.filter(s => 
    s.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedStudent) {
      toast({
        title: 'Selecione um aluno',
        description: 'É necessário selecionar um aluno para registrar a avaliação.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createAssessment.mutateAsync({
        lead_id: selectedStudent,
        unit_id: DEFAULT_UNIT_ID,
        assessed_by: profile?.id || null,
        assessment_date: new Date().toISOString().split('T')[0],
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        chest: formData.chest ? parseFloat(formData.chest) : null,
        waist: formData.waist ? parseFloat(formData.waist) : null,
        hips: formData.hips ? parseFloat(formData.hips) : null,
        right_arm: formData.right_arm ? parseFloat(formData.right_arm) : null,
        left_arm: formData.left_arm ? parseFloat(formData.left_arm) : null,
        right_thigh: formData.right_thigh ? parseFloat(formData.right_thigh) : null,
        left_thigh: formData.left_thigh ? parseFloat(formData.left_thigh) : null,
        right_calf: formData.right_calf ? parseFloat(formData.right_calf) : null,
        left_calf: formData.left_calf ? parseFloat(formData.left_calf) : null,
        neck: formData.neck ? parseFloat(formData.neck) : null,
        notes: formData.notes || null,
        body_fat_percentage: null,
        muscle_mass: null,
        lean_mass: null,
        forearm_right: null,
        forearm_left: null,
        bmi: null,
        photos_url: null,
        protocol: null,
        triceps_skinfold: null,
        chest_skinfold: null,
        abdominal_skinfold: null,
        suprailiac_skinfold: null,
        thigh_skinfold: null,
        subscapular_skinfold: null,
        axillary_skinfold: null,
      });

      setShowNewDialog(false);
      setFormData({
        weight: '',
        height: '',
        chest: '',
        waist: '',
        hips: '',
        right_arm: '',
        left_arm: '',
        right_thigh: '',
        left_thigh: '',
        right_calf: '',
        left_calf: '',
        neck: '',
        notes: '',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const selectedStudentData = students?.find(s => s.id === selectedStudent);

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              Avaliações Físicas
            </h1>
            <p className="text-muted-foreground mt-1">
              Registre e acompanhe as avaliações dos seus alunos
            </p>
          </div>
          
          <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
            <DialogTrigger asChild>
              <Button disabled={!selectedStudent}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Nova Avaliação Física</DialogTitle>
              </DialogHeader>
              
              {selectedStudentData && (
                <div className="mb-4 p-3 bg-secondary rounded-lg">
                  <p className="font-medium">{selectedStudentData.full_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedStudentData.phone}</p>
                </div>
              )}

              <Tabs defaultValue="medidas" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="medidas">Medidas Corporais</TabsTrigger>
                  <TabsTrigger value="composicao">Peso e Altura</TabsTrigger>
                </TabsList>
                
                <TabsContent value="composicao" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="weight">Peso (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 75.5"
                        value={formData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="height">Altura (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        placeholder="Ex: 175"
                        value={formData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="medidas" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="chest">Peitoral (cm)</Label>
                      <Input
                        id="chest"
                        type="number"
                        step="0.1"
                        value={formData.chest}
                        onChange={(e) => handleInputChange('chest', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="waist">Cintura (cm)</Label>
                      <Input
                        id="waist"
                        type="number"
                        step="0.1"
                        value={formData.waist}
                        onChange={(e) => handleInputChange('waist', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hips">Quadril (cm)</Label>
                      <Input
                        id="hips"
                        type="number"
                        step="0.1"
                        value={formData.hips}
                        onChange={(e) => handleInputChange('hips', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="neck">Pescoço (cm)</Label>
                      <Input
                        id="neck"
                        type="number"
                        step="0.1"
                        value={formData.neck}
                        onChange={(e) => handleInputChange('neck', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="right_arm">Braço Direito (cm)</Label>
                      <Input
                        id="right_arm"
                        type="number"
                        step="0.1"
                        value={formData.right_arm}
                        onChange={(e) => handleInputChange('right_arm', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="left_arm">Braço Esquerdo (cm)</Label>
                      <Input
                        id="left_arm"
                        type="number"
                        step="0.1"
                        value={formData.left_arm}
                        onChange={(e) => handleInputChange('left_arm', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="right_thigh">Coxa Direita (cm)</Label>
                      <Input
                        id="right_thigh"
                        type="number"
                        step="0.1"
                        value={formData.right_thigh}
                        onChange={(e) => handleInputChange('right_thigh', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="left_thigh">Coxa Esquerda (cm)</Label>
                      <Input
                        id="left_thigh"
                        type="number"
                        step="0.1"
                        value={formData.left_thigh}
                        onChange={(e) => handleInputChange('left_thigh', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="right_calf">Panturrilha Direita (cm)</Label>
                      <Input
                        id="right_calf"
                        type="number"
                        step="0.1"
                        value={formData.right_calf}
                        onChange={(e) => handleInputChange('right_calf', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="left_calf">Panturrilha Esquerda (cm)</Label>
                      <Input
                        id="left_calf"
                        type="number"
                        step="0.1"
                        value={formData.left_calf}
                        onChange={(e) => handleInputChange('left_calf', e.target.value)}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-4">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Observações sobre a avaliação..."
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={createAssessment.isPending}>
                  {createAssessment.isPending ? 'Salvando...' : 'Salvar Avaliação'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Students List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Selecione um Aluno
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aluno..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {studentsLoading ? (
                  <>
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-14 w-full" />
                    ))}
                  </>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedStudent === student.id 
                          ? 'bg-primary/10 border border-primary' 
                          : 'bg-secondary/50 hover:bg-secondary'
                      }`}
                      onClick={() => setSelectedStudent(student.id)}
                    >
                      <p className="font-medium text-sm">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.phone}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum aluno encontrado
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assessments Content */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedStudent ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Selecione um aluno para ver as avaliações e gráficos de evolução
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Tabs defaultValue="evolucao" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="evolucao" className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Evolução
                  </TabsTrigger>
                  <TabsTrigger value="historico" className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Histórico
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="evolucao" className="mt-4">
                  <EvolutionCharts leadId={selectedStudent} />
                </TabsContent>

                <TabsContent value="historico" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Histórico de Avaliações
                      </CardTitle>
                      <CardDescription>
                        {selectedStudentData 
                          ? `Avaliações de ${selectedStudentData.full_name}`
                          : 'Selecione um aluno para ver o histórico'
                        }
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {assessmentsLoading ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-20 w-full" />
                          ))}
                        </div>
                      ) : assessments && assessments.length > 0 ? (
                        <div className="space-y-3">
                          {assessments.slice().reverse().map((assessment) => (
                            <Card key={assessment.id} className="bg-secondary/30">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    <span className="font-medium">
                                      {format(parseISO(assessment.assessment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                    </span>
                                  </div>
                                  {assessment.bmi && (
                                    <Badge variant="outline">
                                      IMC: {assessment.bmi.toFixed(1)}
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                  {assessment.weight && (
                                    <div className="flex items-center gap-2">
                                      <Scale className="h-4 w-4 text-muted-foreground" />
                                      <span>{assessment.weight} kg</span>
                                    </div>
                                  )}
                                  {assessment.height && (
                                    <div className="flex items-center gap-2">
                                      <Ruler className="h-4 w-4 text-muted-foreground" />
                                      <span>{assessment.height} cm</span>
                                    </div>
                                  )}
                                  {assessment.chest && (
                                    <div>
                                      <span className="text-muted-foreground">Peitoral:</span> {assessment.chest} cm
                                    </div>
                                  )}
                                  {assessment.waist && (
                                    <div>
                                      <span className="text-muted-foreground">Cintura:</span> {assessment.waist} cm
                                    </div>
                                  )}
                                </div>
                                
                                {assessment.notes && (
                                  <p className="mt-3 text-sm text-muted-foreground">
                                    {assessment.notes}
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            Nenhuma avaliação registrada para este aluno
                          </p>
                          <Button onClick={() => setShowNewDialog(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Registrar Primeira Avaliação
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}