import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLead } from '@/hooks/useLeads';
import {
  useAnamnesis,
  useCreateAnamnesis,
  useUpdateAnamnesis,
  useSignAnamnesis,
  medicalConditionOptions,
  objectiveOptions,
} from '@/hooks/useAnamnesis';
import {
  Heart,
  Activity,
  AlertTriangle,
  Pill,
  Cigarette,
  Wine,
  Brain,
  Moon,
  Target,
  FileText,
  Save,
  CheckCircle2,
  ArrowLeft,
  ClipboardCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function Anamnesis() {
  const { leadId } = useParams<{ leadId: string }>();
  const navigate = useNavigate();
  
  const { data: lead, isLoading: leadLoading } = useLead(leadId || '');
  const { data: anamnesis, isLoading: anamnesisLoading } = useAnamnesis(leadId || '');
  const createAnamnesis = useCreateAnamnesis();
  const updateAnamnesis = useUpdateAnamnesis();
  const signAnamnesis = useSignAnamnesis();

  const [formData, setFormData] = useState({
    medical_conditions: [] as string[],
    objectives: [] as string[],
    physical_activity_history: '',
    injuries: '',
    medications: '',
    smoker: false,
    alcohol_consumption: 'nunca',
    stress_level: 'moderado',
    sleep_quality: 'regular',
    observations: '',
  });

  useEffect(() => {
    if (anamnesis) {
      setFormData({
        medical_conditions: anamnesis.medical_conditions || [],
        objectives: anamnesis.objectives || [],
        physical_activity_history: anamnesis.physical_activity_history || '',
        injuries: anamnesis.injuries || '',
        medications: anamnesis.medications || '',
        smoker: anamnesis.smoker || false,
        alcohol_consumption: anamnesis.alcohol_consumption || 'nunca',
        stress_level: anamnesis.stress_level || 'moderado',
        sleep_quality: anamnesis.sleep_quality || 'regular',
        observations: anamnesis.observations || '',
      });
    }
  }, [anamnesis]);

  const handleCheckboxChange = (field: 'medical_conditions' | 'objectives', value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId) return;

    const data = {
      ...formData,
      lead_id: leadId,
    };

    if (anamnesis) {
      await updateAnamnesis.mutateAsync({ id: anamnesis.id, ...data });
    } else {
      await createAnamnesis.mutateAsync(data);
    }
  };

  const handleSign = async () => {
    if (anamnesis) {
      await signAnamnesis.mutateAsync(anamnesis.id);
    }
  };

  const isLoading = leadLoading || anamnesisLoading;
  const isSaving = createAnamnesis.isPending || updateAnamnesis.isPending;
  const isSigned = !!anamnesis?.signed_at;

  if (!leadId) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Lead não encontrado</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold text-foreground">
              Ficha de Anamnese
            </h1>
            {isLoading ? (
              <Skeleton className="h-5 w-48 mt-1" />
            ) : (
              <p className="text-muted-foreground mt-1">
                {lead?.full_name}
              </p>
            )}
          </div>
          {isSigned && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-success/10 text-success">
              <CheckCircle2 className="h-3 w-3" />
              Assinada em {format(new Date(anamnesis!.signed_at!), "dd/MM/yyyy", { locale: ptBR })}
            </Badge>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Condições Médicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-destructive" />
                  Condições Médicas
                </CardTitle>
                <CardDescription>
                  Selecione as condições de saúde pré-existentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {medicalConditionOptions.map((condition) => (
                    <label
                      key={condition}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                        formData.medical_conditions.includes(condition)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={formData.medical_conditions.includes(condition)}
                        onCheckedChange={() => handleCheckboxChange('medical_conditions', condition)}
                        disabled={isSigned}
                      />
                      <span className="text-sm">{condition}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Objetivos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Objetivos
                </CardTitle>
                <CardDescription>
                  Quais são os objetivos do aluno com o treino?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {objectiveOptions.map((objective) => (
                    <label
                      key={objective}
                      className={cn(
                        'flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all',
                        formData.objectives.includes(objective)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      )}
                    >
                      <Checkbox
                        checked={formData.objectives.includes(objective)}
                        onCheckedChange={() => handleCheckboxChange('objectives', objective)}
                        disabled={isSigned}
                      />
                      <span className="text-sm">{objective}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Atividade Física */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-info" />
                  Histórico de Atividade Física
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva o histórico de atividades físicas do aluno (esportes praticados, frequência, tempo de prática...)"
                  value={formData.physical_activity_history}
                  onChange={(e) => setFormData(prev => ({ ...prev, physical_activity_history: e.target.value }))}
                  rows={4}
                  disabled={isSigned}
                />
              </CardContent>
            </Card>

            {/* Lesões e Medicamentos */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    Lesões ou Limitações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Descreva lesões anteriores, cirurgias ou limitações físicas..."
                    value={formData.injuries}
                    onChange={(e) => setFormData(prev => ({ ...prev, injuries: e.target.value }))}
                    rows={4}
                    disabled={isSigned}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="h-5 w-5 text-purple-500" />
                    Medicamentos em Uso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Liste os medicamentos em uso contínuo..."
                    value={formData.medications}
                    onChange={(e) => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                    rows={4}
                    disabled={isSigned}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Hábitos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Hábitos de Vida
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Fumante */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cigarette className="h-5 w-5 text-muted-foreground" />
                    <Label>Fumante</Label>
                  </div>
                  <Switch
                    checked={formData.smoker}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, smoker: checked }))}
                    disabled={isSigned}
                  />
                </div>

                {/* Consumo de Álcool */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Wine className="h-5 w-5 text-muted-foreground" />
                    <Label>Consumo de Álcool</Label>
                  </div>
                  <RadioGroup
                    value={formData.alcohol_consumption}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, alcohol_consumption: value }))}
                    className="flex flex-wrap gap-4"
                    disabled={isSigned}
                  >
                    {['nunca', 'socialmente', 'semanalmente', 'diariamente'].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <RadioGroupItem value={option} id={`alcohol-${option}`} />
                        <Label htmlFor={`alcohol-${option}`} className="capitalize cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Nível de Estresse */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Brain className="h-5 w-5 text-muted-foreground" />
                    <Label>Nível de Estresse</Label>
                  </div>
                  <RadioGroup
                    value={formData.stress_level}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, stress_level: value }))}
                    className="flex flex-wrap gap-4"
                    disabled={isSigned}
                  >
                    {['baixo', 'moderado', 'alto', 'muito alto'].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <RadioGroupItem value={option} id={`stress-${option}`} />
                        <Label htmlFor={`stress-${option}`} className="capitalize cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Qualidade do Sono */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Moon className="h-5 w-5 text-muted-foreground" />
                    <Label>Qualidade do Sono</Label>
                  </div>
                  <RadioGroup
                    value={formData.sleep_quality}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sleep_quality: value }))}
                    className="flex flex-wrap gap-4"
                    disabled={isSigned}
                  >
                    {['ruim', 'regular', 'boa', 'excelente'].map((option) => (
                      <div key={option} className="flex items-center gap-2">
                        <RadioGroupItem value={option} id={`sleep-${option}`} />
                        <Label htmlFor={`sleep-${option}`} className="capitalize cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            {/* Observações */}
            <Card>
              <CardHeader>
                <CardTitle>Observações Gerais</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Adicione informações relevantes que não foram contempladas acima..."
                  value={formData.observations}
                  onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
                  rows={4}
                  disabled={isSigned}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pb-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <div className="flex gap-3">
                {!isSigned && (
                  <>
                    <Button type="submit" disabled={isSaving}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSaving ? 'Salvando...' : 'Salvar'}
                    </Button>
                    {anamnesis && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleSign}
                        disabled={signAnamnesis.isPending}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Assinar Digitalmente
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </form>
        )}
      </div>
    </AppLayout>
  );
}
