
-- Enum para tipo de agendamento
CREATE TYPE public.appointment_type AS ENUM ('aula_experimental', 'avaliacao_fisica', 'treino', 'consulta', 'outros');

-- Enum para status do agendamento
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- Tabela de Disponibilidade dos Professores
CREATE TABLE public.professor_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  professor_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Tabela de Agendamentos
CREATE TABLE public.appointments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  professor_id uuid,
  type appointment_type NOT NULL,
  status appointment_status NOT NULL DEFAULT 'scheduled',
  title text NOT NULL,
  description text,
  scheduled_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  notes text,
  cancelled_at timestamp with time zone,
  cancelled_reason text,
  completed_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de Bloqueios de Agenda (feriados, folgas, etc)
CREATE TABLE public.schedule_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  professor_id uuid,
  block_date date NOT NULL,
  start_time time,
  end_time time,
  all_day boolean DEFAULT false,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Policies para Professor Availability
CREATE POLICY "Staff can view professor availability"
ON public.professor_availability FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)
    OR has_role(auth.uid(), 'professor'::app_role)));

CREATE POLICY "Gestores can manage professor availability"
ON public.professor_availability FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) AND has_role(auth.uid(), 'gestor'::app_role));

CREATE POLICY "Professors can manage their own availability"
ON public.professor_availability FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND professor_id = auth.uid() 
  AND has_role(auth.uid(), 'professor'::app_role));

-- Policies para Appointments
CREATE POLICY "Staff can view appointments"
ON public.appointments FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)
    OR has_role(auth.uid(), 'professor'::app_role)));

CREATE POLICY "Staff can manage appointments"
ON public.appointments FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

CREATE POLICY "Professors can update their appointments"
ON public.appointments FOR UPDATE
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND professor_id = auth.uid() 
  AND has_role(auth.uid(), 'professor'::app_role));

CREATE POLICY "Alunos can view their own appointments"
ON public.appointments FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Policies para Schedule Blocks
CREATE POLICY "Staff can view schedule blocks"
ON public.schedule_blocks FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)
    OR has_role(auth.uid(), 'professor'::app_role)));

CREATE POLICY "Gestores can manage schedule blocks"
ON public.schedule_blocks FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) AND has_role(auth.uid(), 'gestor'::app_role));

-- Triggers para updated_at
CREATE TRIGGER update_professor_availability_updated_at
BEFORE UPDATE ON public.professor_availability
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_appointments_scheduled_date ON public.appointments(scheduled_date);
CREATE INDEX idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX idx_appointments_professor_id ON public.appointments(professor_id);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_professor_availability_professor_id ON public.professor_availability(professor_id);
CREATE INDEX idx_schedule_blocks_date ON public.schedule_blocks(block_date);
