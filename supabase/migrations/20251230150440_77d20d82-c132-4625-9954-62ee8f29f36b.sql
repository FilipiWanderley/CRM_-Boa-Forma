-- Create goals table for tracking business targets
CREATE TABLE public.goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('leads', 'conversions', 'revenue', 'check_ins', 'new_clients')),
  target_value NUMERIC NOT NULL,
  current_value NUMERIC NOT NULL DEFAULT 0,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Create policies for goals access (note: has_role takes user_id first, then role)
CREATE POLICY "Users can view goals from their unit" 
ON public.goals 
FOR SELECT 
USING (public.user_belongs_to_unit(auth.uid(), unit_id));

CREATE POLICY "Gestores can create goals in their unit" 
ON public.goals 
FOR INSERT 
WITH CHECK (
  public.user_belongs_to_unit(auth.uid(), unit_id) 
  AND public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "Gestores can update goals in their unit" 
ON public.goals 
FOR UPDATE 
USING (
  public.user_belongs_to_unit(auth.uid(), unit_id) 
  AND public.has_role(auth.uid(), 'gestor')
);

CREATE POLICY "Gestores can delete goals in their unit" 
ON public.goals 
FOR DELETE 
USING (
  public.user_belongs_to_unit(auth.uid(), unit_id) 
  AND public.has_role(auth.uid(), 'gestor')
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_goals_updated_at
BEFORE UPDATE ON public.goals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();