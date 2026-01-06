-- Create physical assessments table
CREATE TABLE public.physical_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  assessed_by UUID REFERENCES auth.users(id),
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Body measurements
  weight NUMERIC(5,2), -- kg
  height NUMERIC(5,2), -- cm
  body_fat_percentage NUMERIC(4,1),
  muscle_mass NUMERIC(5,2), -- kg
  
  -- Circumferences (cm)
  chest NUMERIC(5,1),
  waist NUMERIC(5,1),
  hips NUMERIC(5,1),
  right_arm NUMERIC(5,1),
  left_arm NUMERIC(5,1),
  right_thigh NUMERIC(5,1),
  left_thigh NUMERIC(5,1),
  right_calf NUMERIC(5,1),
  left_calf NUMERIC(5,1),
  
  -- Calculated fields
  bmi NUMERIC(4,1), -- Body Mass Index
  
  -- Additional info
  notes TEXT,
  photos_url TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.physical_assessments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can manage assessments"
ON public.physical_assessments
FOR ALL
USING (
  unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
);

CREATE POLICY "Staff can view assessments"
ON public.physical_assessments
FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Alunos can view their own assessments"
ON public.physical_assessments
FOR SELECT
USING (
  lead_id IN (
    SELECT l.id FROM leads l 
    WHERE l.profile_id = (SELECT id FROM profiles WHERE user_id = auth.uid() LIMIT 1)
  ) 
  AND has_role(auth.uid(), 'aluno')
);

-- Trigger for updated_at
CREATE TRIGGER update_physical_assessments_updated_at
BEFORE UPDATE ON public.physical_assessments
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Index for faster queries
CREATE INDEX idx_physical_assessments_lead_date ON public.physical_assessments(lead_id, assessment_date DESC);