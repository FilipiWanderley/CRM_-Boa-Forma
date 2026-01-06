
-- Enum para status de assinatura
CREATE TYPE public.subscription_status AS ENUM ('active', 'pending', 'cancelled', 'expired', 'suspended');

-- Enum para status de fatura
CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');

-- Enum para método de pagamento
CREATE TYPE public.payment_method AS ENUM ('pix', 'boleto', 'credit_card', 'debit_card', 'cash');

-- Tabela de Planos
CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true,
  features text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de Assinaturas
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'pending',
  start_date date NOT NULL,
  end_date date NOT NULL,
  auto_renew boolean DEFAULT true,
  payment_day integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de Faturas
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status invoice_status NOT NULL DEFAULT 'pending',
  description text,
  reference_month text,
  pix_code text,
  boleto_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Tabela de Pagamentos
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  payment_method payment_method NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  transaction_id text,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policies para Plans
CREATE POLICY "Staff can view plans"
ON public.plans FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()));

CREATE POLICY "Gestores can manage plans"
ON public.plans FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) AND has_role(auth.uid(), 'gestor'::app_role));

-- Policies para Subscriptions
CREATE POLICY "Staff can view subscriptions"
ON public.subscriptions FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

CREATE POLICY "Staff can manage subscriptions"
ON public.subscriptions FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

-- Policies para Invoices
CREATE POLICY "Staff can view invoices"
ON public.invoices FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

CREATE POLICY "Staff can manage invoices"
ON public.invoices FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

CREATE POLICY "Alunos can view their own invoices"
ON public.invoices FOR SELECT
USING (
  lead_id IN (
    SELECT id FROM public.leads 
    WHERE profile_id = (SELECT id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  AND has_role(auth.uid(), 'aluno'::app_role)
);

-- Policies para Payments
CREATE POLICY "Staff can view payments"
ON public.payments FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

CREATE POLICY "Staff can manage payments"
ON public.payments FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()) 
  AND (has_role(auth.uid(), 'gestor'::app_role) 
    OR has_role(auth.uid(), 'recepcao'::app_role)));

-- Triggers para updated_at
CREATE TRIGGER update_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Indexes
CREATE INDEX idx_subscriptions_lead_id ON public.subscriptions(lead_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_invoices_lead_id ON public.invoices(lead_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
