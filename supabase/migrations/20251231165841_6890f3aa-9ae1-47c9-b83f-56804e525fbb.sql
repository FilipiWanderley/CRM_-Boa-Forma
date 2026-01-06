-- Activity logs table for audit trail
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, -- 'lead', 'invoice', 'subscription', 'workout', etc.
  entity_id UUID,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'status_change', etc.
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_unit_id ON public.activity_logs(unit_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Gestores can view activity logs"
ON public.activity_logs
FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) AND has_role(auth.uid(), 'gestor'));

CREATE POLICY "Staff can create activity logs"
ON public.activity_logs
FOR INSERT
WITH CHECK (unit_id = get_user_unit_id(auth.uid()));

-- Contracts table
CREATE TABLE public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  template_id UUID,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'signed', 'cancelled'
  content TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_ip TEXT,
  signed_user_agent TEXT,
  signature_data TEXT, -- base64 signature image
  valid_from DATE,
  valid_until DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Contract templates table
CREATE TABLE public.contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contracts_unit_id ON public.contracts(unit_id);
CREATE INDEX idx_contracts_lead_id ON public.contracts(lead_id);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contract_templates_unit_id ON public.contract_templates(unit_id);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contracts
CREATE POLICY "Staff can manage contracts"
ON public.contracts
FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao')));

CREATE POLICY "Alunos can view their contracts"
ON public.contracts
FOR SELECT
USING (
  lead_id IN (
    SELECT l.id FROM leads l 
    WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  ) AND has_role(auth.uid(), 'aluno')
);

CREATE POLICY "Alunos can sign their pending contracts"
ON public.contracts
FOR UPDATE
USING (
  lead_id IN (
    SELECT l.id FROM leads l 
    WHERE l.profile_id = (SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1)
  ) 
  AND status = 'pending'
  AND has_role(auth.uid(), 'aluno')
);

-- RLS Policies for contract templates
CREATE POLICY "Gestores can manage contract templates"
ON public.contract_templates
FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) AND has_role(auth.uid(), 'gestor'));

CREATE POLICY "Staff can view contract templates"
ON public.contract_templates
FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao')));

-- Trigger for updated_at
CREATE TRIGGER update_contracts_updated_at
BEFORE UPDATE ON public.contracts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contract_templates_updated_at
BEFORE UPDATE ON public.contract_templates
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();