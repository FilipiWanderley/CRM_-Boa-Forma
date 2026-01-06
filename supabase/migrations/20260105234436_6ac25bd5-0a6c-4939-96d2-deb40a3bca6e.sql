-- =============================================
-- MÓDULO 8: AULAS COLETIVAS
-- =============================================

-- Tipos de aulas coletivas (Yoga, Spinning, Natação, etc.)
CREATE TABLE public.class_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_capacity INTEGER NOT NULL DEFAULT 20,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Horários recorrentes das aulas
CREATE TABLE public.class_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  class_type_id UUID NOT NULL REFERENCES public.class_types(id) ON DELETE CASCADE,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER, -- Override do class_type se definido
  location TEXT, -- Sala ou local específico
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Instâncias específicas de aulas (geradas a partir dos schedules ou criadas manualmente)
CREATE TABLE public.class_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  class_type_id UUID NOT NULL REFERENCES public.class_types(id) ON DELETE CASCADE,
  class_schedule_id UUID REFERENCES public.class_schedules(id) ON DELETE SET NULL,
  professor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_capacity INTEGER NOT NULL,
  current_enrollments INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  location TEXT,
  notes TEXT,
  cancelled_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inscrições nas aulas
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'confirmed', 'attended', 'no_show', 'cancelled')),
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  checked_in_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(class_session_id, lead_id)
);

-- Lista de espera
CREATE TABLE public.class_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  class_session_id UUID NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified_at TIMESTAMP WITH TIME ZONE,
  expired_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'expired', 'cancelled')),
  UNIQUE(class_session_id, lead_id)
);

-- Enable RLS
ALTER TABLE public.class_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_waitlist ENABLE ROW LEVEL SECURITY;

-- Policies for class_types
CREATE POLICY "Staff can manage class types" ON public.class_types
  FOR ALL USING (
    unit_id = get_user_unit_id(auth.uid()) AND 
    (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
  );

CREATE POLICY "Users can view class types" ON public.class_types
  FOR SELECT USING (unit_id = get_user_unit_id(auth.uid()));

-- Policies for class_schedules
CREATE POLICY "Staff can manage class schedules" ON public.class_schedules
  FOR ALL USING (
    unit_id = get_user_unit_id(auth.uid()) AND 
    (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
  );

CREATE POLICY "Users can view class schedules" ON public.class_schedules
  FOR SELECT USING (unit_id = get_user_unit_id(auth.uid()));

-- Policies for class_sessions
CREATE POLICY "Staff can manage class sessions" ON public.class_sessions
  FOR ALL USING (
    unit_id = get_user_unit_id(auth.uid()) AND 
    (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
  );

CREATE POLICY "Users can view class sessions" ON public.class_sessions
  FOR SELECT USING (unit_id = get_user_unit_id(auth.uid()));

-- Policies for class_enrollments
CREATE POLICY "Staff can manage enrollments" ON public.class_enrollments
  FOR ALL USING (
    unit_id = get_user_unit_id(auth.uid()) AND 
    (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
  );

CREATE POLICY "Alunos can view their enrollments" ON public.class_enrollments
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l 
      WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    ) AND has_role(auth.uid(), 'aluno')
  );

CREATE POLICY "Alunos can enroll themselves" ON public.class_enrollments
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l 
      WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    ) AND has_role(auth.uid(), 'aluno')
  );

CREATE POLICY "Alunos can cancel their enrollment" ON public.class_enrollments
  FOR UPDATE USING (
    lead_id IN (
      SELECT l.id FROM leads l 
      WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    ) AND has_role(auth.uid(), 'aluno')
  );

-- Policies for class_waitlist
CREATE POLICY "Staff can manage waitlist" ON public.class_waitlist
  FOR ALL USING (
    unit_id = get_user_unit_id(auth.uid()) AND 
    (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor') OR has_role(auth.uid(), 'recepcao'))
  );

CREATE POLICY "Alunos can view their waitlist" ON public.class_waitlist
  FOR SELECT USING (
    lead_id IN (
      SELECT l.id FROM leads l 
      WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    ) AND has_role(auth.uid(), 'aluno')
  );

CREATE POLICY "Alunos can join waitlist" ON public.class_waitlist
  FOR INSERT WITH CHECK (
    lead_id IN (
      SELECT l.id FROM leads l 
      WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
    ) AND has_role(auth.uid(), 'aluno')
  );

-- Function to update enrollment count
CREATE OR REPLACE FUNCTION public.update_class_session_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.class_sessions 
    SET current_enrollments = (
      SELECT COUNT(*) FROM public.class_enrollments 
      WHERE class_session_id = NEW.class_session_id 
      AND status IN ('enrolled', 'confirmed', 'attended')
    )
    WHERE id = NEW.class_session_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.class_sessions 
    SET current_enrollments = (
      SELECT COUNT(*) FROM public.class_enrollments 
      WHERE class_session_id = OLD.class_session_id 
      AND status IN ('enrolled', 'confirmed', 'attended')
    )
    WHERE id = OLD.class_session_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for enrollment count
CREATE TRIGGER update_enrollment_count
AFTER INSERT OR UPDATE OR DELETE ON public.class_enrollments
FOR EACH ROW EXECUTE FUNCTION public.update_class_session_enrollment_count();

-- Function to move from waitlist to enrolled when spot opens
CREATE OR REPLACE FUNCTION public.process_class_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_in_waitlist RECORD;
  session_capacity INTEGER;
  current_count INTEGER;
BEGIN
  -- Only process when an enrollment is cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Get session capacity and current count
    SELECT max_capacity, current_enrollments INTO session_capacity, current_count
    FROM public.class_sessions WHERE id = NEW.class_session_id;
    
    -- Check if there's room
    IF current_count < session_capacity THEN
      -- Get next person in waitlist
      SELECT * INTO next_in_waitlist
      FROM public.class_waitlist
      WHERE class_session_id = NEW.class_session_id
      AND status = 'waiting'
      ORDER BY position ASC
      LIMIT 1;
      
      IF next_in_waitlist.id IS NOT NULL THEN
        -- Update waitlist status
        UPDATE public.class_waitlist
        SET status = 'notified', notified_at = now()
        WHERE id = next_in_waitlist.id;
        
        -- Create enrollment
        INSERT INTO public.class_enrollments (unit_id, class_session_id, lead_id, status)
        VALUES (next_in_waitlist.unit_id, next_in_waitlist.class_session_id, next_in_waitlist.lead_id, 'enrolled');
        
        -- Update waitlist status to enrolled
        UPDATE public.class_waitlist
        SET status = 'enrolled'
        WHERE id = next_in_waitlist.id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for waitlist processing
CREATE TRIGGER process_waitlist_on_cancellation
AFTER UPDATE ON public.class_enrollments
FOR EACH ROW EXECUTE FUNCTION public.process_class_waitlist();

-- Add indexes for performance
CREATE INDEX idx_class_sessions_date ON public.class_sessions(session_date);
CREATE INDEX idx_class_sessions_unit ON public.class_sessions(unit_id);
CREATE INDEX idx_class_enrollments_session ON public.class_enrollments(class_session_id);
CREATE INDEX idx_class_enrollments_lead ON public.class_enrollments(lead_id);
CREATE INDEX idx_class_waitlist_session ON public.class_waitlist(class_session_id);