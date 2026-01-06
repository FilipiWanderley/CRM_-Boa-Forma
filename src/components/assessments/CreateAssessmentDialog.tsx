import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateAssessment } from '@/hooks/usePhysicalAssessments';
import { useAuth } from '@/hooks/useAuth';
import { Plus, Loader2, Scale, Ruler, Activity, Calculator, Info } from 'lucide-react';
import { 
  calculateBodyFat, 
  getRequiredSkinfolds, 
  skinfoldLabels, 
  getBodyFatClassification,
  type Gender,
  type Protocol,
  type SkinfoldData,
  type CalculationResult
} from '@/lib/bodyFatCalculations';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CreateAssessmentDialogProps {
  leadId: string;
  unitId: string;
  leadBirthDate?: string | null;
  leadGender?: string | null;
}

export function CreateAssessmentDialog({ leadId, unitId, leadBirthDate, leadGender }: CreateAssessmentDialogProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createAssessment = useCreateAssessment();

  // Basic form state
  const [form, setForm] = useState({
    assessment_date: new Date().toISOString().split('T')[0],
    weight: '',
    height: '',
    body_fat_percentage: '',
    muscle_mass: '',
    lean_mass: '',
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
    forearm_right: '',
    forearm_left: '',
    notes: '',
  });

  // Skinfold measurements
  const [skinfolds, setSkinfolds] = useState<SkinfoldData>({
    triceps: undefined,
    chest: undefined,
    abdominal: undefined,
    suprailiac: undefined,
    thigh: undefined,
    subscapular: undefined,
    axillary: undefined,
  });

  // Protocol settings
  const [protocol, setProtocol] = useState<Protocol>('pollock3');
  const [gender, setGender] = useState<Gender>((leadGender === 'M' || leadGender === 'masculino') ? 'male' : 'female');
  const [age, setAge] = useState<number>(() => {
    if (leadBirthDate) {
      const birth = new Date(leadBirthDate);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }
    return 30;
  });

  // Calculation result
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);

  // Required skinfolds for current protocol
  const requiredSkinfolds = useMemo(() => getRequiredSkinfolds(protocol, gender), [protocol, gender]);

  // Auto-calculate when skinfolds change
  useEffect(() => {
    if (form.weight) {
      const result = calculateBodyFat(protocol, gender, age, parseFloat(form.weight), skinfolds);
      setCalculationResult(result);
    } else {
      setCalculationResult(null);
    }
  }, [skinfolds, protocol, gender, age, form.weight]);

  const handleSubmit = async () => {
    const bmi = form.weight && form.height 
      ? parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)
      : null;

    await createAssessment.mutateAsync({
      unit_id: unitId,
      lead_id: leadId,
      assessed_by: user?.id || null,
      assessment_date: form.assessment_date,
      weight: form.weight ? parseFloat(form.weight) : null,
      height: form.height ? parseFloat(form.height) : null,
      body_fat_percentage: calculationResult?.bodyFatPercentage ?? (form.body_fat_percentage ? parseFloat(form.body_fat_percentage) : null),
      muscle_mass: form.muscle_mass ? parseFloat(form.muscle_mass) : null,
      lean_mass: calculationResult?.leanMass ?? (form.lean_mass ? parseFloat(form.lean_mass) : null),
      chest: form.chest ? parseFloat(form.chest) : null,
      waist: form.waist ? parseFloat(form.waist) : null,
      hips: form.hips ? parseFloat(form.hips) : null,
      right_arm: form.right_arm ? parseFloat(form.right_arm) : null,
      left_arm: form.left_arm ? parseFloat(form.left_arm) : null,
      right_thigh: form.right_thigh ? parseFloat(form.right_thigh) : null,
      left_thigh: form.left_thigh ? parseFloat(form.left_thigh) : null,
      right_calf: form.right_calf ? parseFloat(form.right_calf) : null,
      left_calf: form.left_calf ? parseFloat(form.left_calf) : null,
      neck: form.neck ? parseFloat(form.neck) : null,
      forearm_right: form.forearm_right ? parseFloat(form.forearm_right) : null,
      forearm_left: form.forearm_left ? parseFloat(form.forearm_left) : null,
      bmi: bmi ? Number(bmi.toFixed(1)) : null,
      notes: form.notes || null,
      photos_url: null,
      protocol: calculationResult?.protocol || null,
      triceps_skinfold: skinfolds.triceps ?? null,
      chest_skinfold: skinfolds.chest ?? null,
      abdominal_skinfold: skinfolds.abdominal ?? null,
      suprailiac_skinfold: skinfolds.suprailiac ?? null,
      thigh_skinfold: skinfolds.thigh ?? null,
      subscapular_skinfold: skinfolds.subscapular ?? null,
      axillary_skinfold: skinfolds.axillary ?? null,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setForm({
      assessment_date: new Date().toISOString().split('T')[0],
      weight: '',
      height: '',
      body_fat_percentage: '',
      muscle_mass: '',
      lean_mass: '',
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
      forearm_right: '',
      forearm_left: '',
      notes: '',
    });
    setSkinfolds({
      triceps: undefined,
      chest: undefined,
      abdominal: undefined,
      suprailiac: undefined,
      thigh: undefined,
      subscapular: undefined,
      axillary: undefined,
    });
    setCalculationResult(null);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateSkinfold = (field: keyof SkinfoldData, value: string) => {
    setSkinfolds((prev) => ({ 
      ...prev, 
      [field]: value ? parseFloat(value) : undefined 
    }));
  };

  const classification = calculationResult 
    ? getBodyFatClassification(calculationResult.bodyFatPercentage, gender)
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Avaliação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Avaliação Física</DialogTitle>
          <DialogDescription>
            Preencha os dados da avaliação. Use as dobras cutâneas para cálculo automático de % gordura.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic" className="gap-1.5 text-xs">
              <Scale className="h-3.5 w-3.5" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="skinfolds" className="gap-1.5 text-xs">
              <Calculator className="h-3.5 w-3.5" />
              Dobras
            </TabsTrigger>
            <TabsTrigger value="measures" className="gap-1.5 text-xs">
              <Ruler className="h-3.5 w-3.5" />
              Perímetros
            </TabsTrigger>
            <TabsTrigger value="composition" className="gap-1.5 text-xs">
              <Activity className="h-3.5 w-3.5" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* Basic Tab */}
          <TabsContent value="basic" className="space-y-4 pt-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="assessment_date">Data</Label>
                <Input
                  id="assessment_date"
                  type="date"
                  value={form.assessment_date}
                  onChange={(e) => updateField('assessment_date', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="gender">Sexo</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Masculino</SelectItem>
                    <SelectItem value="female">Feminino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="age">Idade (anos)</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 75.5"
                  value={form.weight}
                  onChange={(e) => updateField('weight', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  step="0.1"
                  placeholder="Ex: 175"
                  value={form.height}
                  onChange={(e) => updateField('height', e.target.value)}
                />
              </div>
            </div>

            {form.weight && form.height && (
              <Card className="bg-muted/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">IMC Calculado:</span>
                    <span className="font-semibold">
                      {(parseFloat(form.weight) / Math.pow(parseFloat(form.height) / 100, 2)).toFixed(1)} kg/m²
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Notas sobre a avaliação..."
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
              />
            </div>
          </TabsContent>

          {/* Skinfolds Tab */}
          <TabsContent value="skinfolds" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Protocolo</Label>
                <Select value={protocol} onValueChange={(v) => setProtocol(v as Protocol)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pollock3">Pollock 3 Dobras</SelectItem>
                    <SelectItem value="pollock7">Pollock 7 Dobras</SelectItem>
                    <SelectItem value="guedes">Guedes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      <strong>Pollock 3:</strong> Homens (peitoral, abdominal, coxa) / Mulheres (tríceps, suprailíaca, coxa)<br/>
                      <strong>Pollock 7:</strong> 7 dobras para maior precisão<br/>
                      <strong>Guedes:</strong> Protocolo brasileiro
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <p className="text-sm text-muted-foreground">
              Dobras cutâneas em milímetros (mm). Campos destacados são obrigatórios para o protocolo selecionado.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {(['triceps', 'chest', 'subscapular', 'axillary', 'suprailiac', 'abdominal', 'thigh'] as const).map((site) => {
                const isRequired = requiredSkinfolds.includes(site);
                return (
                  <div key={site} className={isRequired ? 'ring-2 ring-primary/20 rounded-lg p-2 -m-2' : ''}>
                    <Label htmlFor={site} className="flex items-center gap-2">
                      {skinfoldLabels[site]}
                      {isRequired && <Badge variant="outline" className="text-[10px] px-1">Obrigatório</Badge>}
                    </Label>
                    <Input
                      id={site}
                      type="number"
                      step="0.1"
                      placeholder="mm"
                      value={skinfolds[site] ?? ''}
                      onChange={(e) => updateSkinfold(site, e.target.value)}
                      className={isRequired ? 'border-primary/50' : ''}
                    />
                  </div>
                );
              })}
            </div>

            {/* Live Calculation Preview */}
            {calculationResult && (
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Resultado do Cálculo</span>
                    <Badge variant="outline" className="text-xs">{calculationResult.protocol}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">% Gordura</p>
                      <p className="text-2xl font-bold">{calculationResult.bodyFatPercentage}%</p>
                      {classification && (
                        <p className={`text-xs font-medium ${classification.color}`}>
                          {classification.classification}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Densidade Corporal</p>
                      <p className="text-lg font-semibold">{calculationResult.bodyDensity}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Massa Magra</p>
                      <p className="text-lg font-semibold">{calculationResult.leanMass} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Massa Gorda</p>
                      <p className="text-lg font-semibold">{calculationResult.fatMass} kg</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {!calculationResult && form.weight && (
              <Card className="bg-muted/50">
                <CardContent className="p-4 text-center text-sm text-muted-foreground">
                  Preencha as dobras obrigatórias para calcular automaticamente o % de gordura
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Measures Tab */}
          <TabsContent value="measures" className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              Circunferências em centímetros (cm)
            </p>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="neck">Pescoço</Label>
                <Input
                  id="neck"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.neck}
                  onChange={(e) => updateField('neck', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="chest">Peito</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.chest}
                  onChange={(e) => updateField('chest', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="waist">Cintura</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.waist}
                  onChange={(e) => updateField('waist', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hips">Quadril</Label>
                <Input
                  id="hips"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.hips}
                  onChange={(e) => updateField('hips', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="right_arm">Braço D</Label>
                <Input
                  id="right_arm"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.right_arm}
                  onChange={(e) => updateField('right_arm', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="left_arm">Braço E</Label>
                <Input
                  id="left_arm"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.left_arm}
                  onChange={(e) => updateField('left_arm', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="forearm_right">Antebraço D</Label>
                <Input
                  id="forearm_right"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.forearm_right}
                  onChange={(e) => updateField('forearm_right', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="forearm_left">Antebraço E</Label>
                <Input
                  id="forearm_left"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.forearm_left}
                  onChange={(e) => updateField('forearm_left', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="right_thigh">Coxa D</Label>
                <Input
                  id="right_thigh"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.right_thigh}
                  onChange={(e) => updateField('right_thigh', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="left_thigh">Coxa E</Label>
                <Input
                  id="left_thigh"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.left_thigh}
                  onChange={(e) => updateField('left_thigh', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="right_calf">Panturrilha D</Label>
                <Input
                  id="right_calf"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.right_calf}
                  onChange={(e) => updateField('right_calf', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="left_calf">Panturrilha E</Label>
                <Input
                  id="left_calf"
                  type="number"
                  step="0.1"
                  placeholder="cm"
                  value={form.left_calf}
                  onChange={(e) => updateField('left_calf', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="composition" className="space-y-4 pt-4">
            {calculationResult ? (
              <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <p className="text-sm text-muted-foreground mb-1">Percentual de Gordura Corporal</p>
                    <p className="text-5xl font-bold text-foreground">{calculationResult.bodyFatPercentage}%</p>
                    {classification && (
                      <Badge className={`mt-2 ${classification.color} bg-transparent border`}>
                        {classification.classification}
                      </Badge>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{calculationResult.protocol}</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Massa Magra</p>
                      <p className="text-xl font-bold">{calculationResult.leanMass} kg</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Massa Gorda</p>
                      <p className="text-xl font-bold">{calculationResult.fatMass} kg</p>
                    </div>
                    <div className="p-3 bg-background/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Densidade</p>
                      <p className="text-xl font-bold">{calculationResult.bodyDensity}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-muted/50">
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Preencha o peso e as dobras cutâneas na aba "Dobras" para ver o resultado calculado automaticamente.
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="body_fat_percentage">% Gordura (manual)</Label>
                <Input
                  id="body_fat_percentage"
                  type="number"
                  step="0.1"
                  placeholder="Sobrescrever cálculo automático"
                  value={form.body_fat_percentage}
                  onChange={(e) => updateField('body_fat_percentage', e.target.value)}
                  disabled={!!calculationResult}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {calculationResult ? 'Usando valor calculado' : 'Use se não for usar dobras'}
                </p>
              </div>
              <div>
                <Label htmlFor="muscle_mass">Massa Muscular (kg)</Label>
                <Input
                  id="muscle_mass"
                  type="number"
                  step="0.1"
                  placeholder="Bioimpedância"
                  value={form.muscle_mass}
                  onChange={(e) => updateField('muscle_mass', e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createAssessment.isPending}>
            {createAssessment.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Avaliação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
