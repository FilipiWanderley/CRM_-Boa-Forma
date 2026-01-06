
-- Alunos podem ver seu próprio lead (vinculado via profile_id)
CREATE POLICY "Alunos can view their own lead"
ON public.leads
FOR SELECT
USING (
  profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Alunos podem ver seus próprios treinos
CREATE POLICY "Alunos can view their own workouts"
ON public.workouts
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Alunos podem ver exercícios dos seus treinos
CREATE POLICY "Alunos can view their workout exercises"
ON public.workout_exercises
FOR SELECT
USING (
  workout_id IN (
    SELECT w.id FROM public.workouts w
    JOIN public.leads l ON w.lead_id = l.id
    WHERE l.profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Alunos podem ver seus próprios check-ins
CREATE POLICY "Alunos can view their own check-ins"
ON public.check_ins
FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Alunos podem criar check-ins para si mesmos
CREATE POLICY "Alunos can create their own check-ins"
ON public.check_ins
FOR INSERT
WITH CHECK (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);
