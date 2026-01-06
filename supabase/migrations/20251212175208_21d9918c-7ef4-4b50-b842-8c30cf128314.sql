-- =============================================
-- MÓDULO 4 - APP DO ALUNO
-- Tabelas: workouts, workout_exercises, exercises, check_ins
-- =============================================

-- Tabela de exercícios (banco de exercícios)
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_group TEXT,
  video_url TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fichas de treino
CREATE TABLE public.workouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- Ex: "Treino A - Peito e Tríceps"
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  valid_from DATE,
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Exercícios dentro de cada ficha de treino
CREATE TABLE public.workout_exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES public.exercises(id),
  exercise_name TEXT NOT NULL, -- Permite exercícios customizados
  sets INTEGER NOT NULL DEFAULT 3,
  reps TEXT NOT NULL DEFAULT '12', -- Ex: "12", "10-12", "até falha"
  rest_seconds INTEGER DEFAULT 60,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Check-ins / Acessos (histórico de entrada na academia)
CREATE TABLE public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT DEFAULT 'qr_code', -- qr_code, biometria, manual
  device_id TEXT
);

-- Enable RLS
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;

-- Exercises: todos podem ver (banco público de exercícios)
CREATE POLICY "Anyone can view exercises"
ON public.exercises FOR SELECT
USING (true);

CREATE POLICY "Staff can manage exercises"
ON public.exercises FOR ALL
USING (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'));

-- Workouts: staff da unidade pode gerenciar
CREATE POLICY "Staff can view workouts"
ON public.workouts FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Staff can manage workouts"
ON public.workouts FOR ALL
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
);

-- Workout exercises: mesmas regras do workout
CREATE POLICY "Staff can view workout exercises"
ON public.workout_exercises FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
    AND w.unit_id = get_user_unit_id(auth.uid())
  ) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Staff can manage workout exercises"
ON public.workout_exercises FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.workouts w
    WHERE w.id = workout_exercises.workout_id
    AND w.unit_id = get_user_unit_id(auth.uid())
  ) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
);

-- Check-ins: staff pode ver e registrar
CREATE POLICY "Staff can view check-ins"
ON public.check_ins FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Staff can create check-ins"
ON public.check_ins FOR INSERT
WITH CHECK (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

-- Triggers para updated_at
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON public.exercises
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_workouts_updated_at
BEFORE UPDATE ON public.workouts
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices para performance
CREATE INDEX idx_workouts_lead_id ON public.workouts(lead_id);
CREATE INDEX idx_workouts_unit_id ON public.workouts(unit_id);
CREATE INDEX idx_check_ins_lead_id ON public.check_ins(lead_id);
CREATE INDEX idx_check_ins_checked_in_at ON public.check_ins(checked_in_at DESC);