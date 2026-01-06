-- =============================================
-- MÓDULO 6 - AUTOMAÇÃO BÁSICA
-- Tabelas: automation_rules, automation_logs
-- =============================================

-- Tipos de automação
CREATE TYPE public.automation_type AS ENUM (
  'welcome',           -- Boas-vindas
  'renewal_reminder',  -- Lembrete de renovação
  'birthday',          -- Aniversário
  'overdue',           -- Cobrança por atraso
  'inactivity'         -- Inatividade
);

-- Status da automação
CREATE TYPE public.automation_status AS ENUM (
  'pending',
  'sent',
  'failed',
  'cancelled'
);

-- Regras de automação configuráveis
CREATE TABLE public.automation_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type automation_type NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_days INTEGER, -- Dias para disparo (ex: -7 = 7 dias antes, 3 = 3 dias depois)
  subject TEXT NOT NULL,
  message_template TEXT NOT NULL,
  channel TEXT DEFAULT 'email', -- email, whatsapp, sms
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Logs de automações disparadas
CREATE TABLE public.automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES public.automation_rules(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  type automation_type NOT NULL,
  channel TEXT DEFAULT 'email',
  recipient TEXT NOT NULL, -- email ou telefone
  subject TEXT,
  message TEXT NOT NULL,
  status automation_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para automation_rules
CREATE POLICY "Staff can view automation rules"
ON public.automation_rules FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Gestores can manage automation rules"
ON public.automation_rules FOR ALL
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  has_role(auth.uid(), 'gestor')
);

-- Políticas para automation_logs
CREATE POLICY "Staff can view automation logs"
ON public.automation_logs FOR SELECT
USING (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "System can create automation logs"
ON public.automation_logs FOR INSERT
WITH CHECK (
  unit_id = get_user_unit_id(auth.uid()) AND 
  (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

-- Trigger para updated_at
CREATE TRIGGER update_automation_rules_updated_at
BEFORE UPDATE ON public.automation_rules
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Índices
CREATE INDEX idx_automation_logs_lead_id ON public.automation_logs(lead_id);
CREATE INDEX idx_automation_logs_created_at ON public.automation_logs(created_at DESC);
CREATE INDEX idx_automation_logs_status ON public.automation_logs(status);
CREATE INDEX idx_automation_rules_type ON public.automation_rules(type);