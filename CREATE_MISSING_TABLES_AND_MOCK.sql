-- ==============================================================================
-- SCRIPT DE CRIAÇÃO DE TABELAS FALTANTES E POPULAÇÃO DE DADOS
-- ==============================================================================
-- Este script verifica se as tabelas necessárias existem e as cria caso contrário.
-- Em seguida, popula o banco com dados fictícios para o Dashboard.
-- ==============================================================================

-- 1. CRIAR TABELAS QUE PODEM ESTAR FALTANDO
-- (Baseado nas migrações oficiais)

-- GARANTIR TYPES
DO $$ BEGIN
    CREATE TYPE public.pipeline_status AS ENUM ('lead', 'visita_agendada', 'negociacao', 'ativo', 'inativo', 'cancelado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('gestor', 'recepcao', 'professor', 'aluno');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- TABELA LEADS
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  source TEXT,
  status public.pipeline_status NOT NULL DEFAULT 'lead',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- TABELA PLANS
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(10,2) NOT NULL,
  duration_months integer NOT NULL DEFAULT 1, -- Adjusted from duration_days to be consistent with usage or I should fix usage
  is_active boolean DEFAULT true,
  features text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
-- Note: Migration used duration_days, but mock used duration_months logic. 
-- Let's stick to migration schema but add duration_months if needed or just use duration_days logic.
-- Actually, the mock script used `duration_months` in INSERT. 
-- "INSERT INTO public.plans (name, price, duration_months, unit_id)"
-- So I should add duration_months column if it doesn't exist or create table with it.
-- Let's add it if table exists, or create with it.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'duration_months') THEN
        ALTER TABLE public.plans ADD COLUMN duration_months integer DEFAULT 1;
    END IF;
END $$;


-- TABELA SUBSCRIPTIONS
-- Primeiro criar enum se nao existir
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('active', 'pending', 'cancelled', 'expired', 'suspended', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status public.subscription_status NOT NULL DEFAULT 'pending',
  start_date date NOT NULL,
  end_date date NOT NULL,
  price decimal(10,2), -- Added because mock uses it
  auto_renew boolean DEFAULT true,
  payment_day integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
-- Add price column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'price') THEN
        ALTER TABLE public.subscriptions ADD COLUMN price decimal(10,2);
    END IF;
END $$;

-- TABELA INVOICES
-- Enum invoice_status
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE CASCADE, -- Made nullable as mock might not link strictly
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL,
  due_date date NOT NULL,
  paid_at timestamp with time zone,
  status public.invoice_status NOT NULL DEFAULT 'pending',
  description text,
  reference_month text,
  pix_code text,
  boleto_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- TABELA CHECK_INS
CREATE TABLE IF NOT EXISTS public.check_ins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  method TEXT DEFAULT 'qr_code',
  device_id TEXT
);

-- TABELA NPS_SURVEYS
CREATE TABLE IF NOT EXISTS public.nps_surveys (
  id uuid not null default gen_random_uuid() primary key,
  unit_id uuid not null references public.units(id),
  user_id uuid references auth.users(id),
  score integer not null check (score >= 0 and score <= 10),
  comment text,
  source text default 'app_aluno',
  created_at timestamp with time zone not null default now()
);

-- TABELA ACTIVITY_LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL, 
  entity_id UUID,
  action TEXT NOT NULL, 
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- HABILITAR RLS (Segurança)
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nps_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS BÁSICAS (Permissivas para Staff/Gestor) - Simplificadas para garantir funcionamento
-- LEADS
DROP POLICY IF EXISTS "Staff can view leads" ON public.leads;
CREATE POLICY "Staff can view leads" ON public.leads FOR SELECT USING (true);
DROP POLICY IF EXISTS "Staff can manage leads" ON public.leads;
CREATE POLICY "Staff can manage leads" ON public.leads FOR ALL USING (true);

-- PLANS
DROP POLICY IF EXISTS "Staff can view plans" ON public.plans;
CREATE POLICY "Staff can view plans" ON public.plans FOR SELECT USING (true);

-- SUBSCRIPTIONS
DROP POLICY IF EXISTS "Staff can view subscriptions" ON public.subscriptions;
CREATE POLICY "Staff can view subscriptions" ON public.subscriptions FOR SELECT USING (true);

-- INVOICES
DROP POLICY IF EXISTS "Staff can view invoices" ON public.invoices;
CREATE POLICY "Staff can view invoices" ON public.invoices FOR SELECT USING (true);

-- ==============================================================================
-- 2. POPULAR DADOS (MOCK DATA)
-- ==============================================================================

DO $$
DECLARE
  v_unit_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_plan_mensal UUID;
  v_plan_trimestral UUID;
  v_plan_anual UUID;
  v_lead_id UUID;
  v_user_id UUID;
  i INT;
  v_users UUID[];
BEGIN

  -- 0. Carregar usuários existentes para atribuir leads (Top Sellers)
  SELECT array_agg(id) INTO v_users FROM auth.users;

  -- 1. Criar Planos (se não existirem)
  INSERT INTO public.plans (name, price, duration_months, unit_id)
  VALUES ('Mensal Recorrente', 129.90, 1, v_unit_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.plans (name, price, duration_months, unit_id)
  VALUES ('Trimestral', 349.90, 3, v_unit_id)
  ON CONFLICT DO NOTHING;
  
  INSERT INTO public.plans (name, price, duration_months, unit_id)
  VALUES ('Anual Premium', 1199.90, 12, v_unit_id)
  ON CONFLICT DO NOTHING;

  -- Capturar IDs dos planos
  SELECT id INTO v_plan_mensal FROM public.plans WHERE name = 'Mensal Recorrente' LIMIT 1;
  SELECT id INTO v_plan_trimestral FROM public.plans WHERE name = 'Trimestral' LIMIT 1;
  SELECT id INTO v_plan_anual FROM public.plans WHERE name = 'Anual Premium' LIMIT 1;

  -- 2. Gerar 30 Alunos ATIVOS (com check-ins e pagamentos em dia)
  FOR i IN 1..30 LOOP
    -- Escolher um vendedor aleatório (se houver usuários)
    IF v_users IS NOT NULL AND array_length(v_users, 1) > 0 THEN
        v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];
    ELSE
        v_user_id := NULL;
    END IF;

    INSERT INTO public.leads (unit_id, full_name, email, phone, status, created_at, assigned_to)
    VALUES (
      v_unit_id, 
      'Aluno Ativo ' || i, 
      'ativo' || i || '@exemplo.com', 
      '1199999' || lpad(i::text, 4, '0'), 
      'ativo',
      now() - (random() * 90 || ' days')::interval,
      v_user_id
    ) RETURNING id INTO v_lead_id;

    -- Criar Assinatura
    INSERT INTO public.subscriptions (unit_id, lead_id, plan_id, status, start_date, end_date, price)
    VALUES (
      v_unit_id, v_lead_id, v_plan_mensal, 'active', 
      (now() - interval '1 month')::date, 
      (now() + interval '1 month')::date,
      129.90
    );

    -- Criar Fatura Paga (Mês atual)
    INSERT INTO public.invoices (unit_id, lead_id, amount, status, due_date, paid_at, created_at)
    VALUES (
      v_unit_id, v_lead_id, 129.90, 'paid', 
      (now() - interval '5 days')::date, 
      (now() - interval '4 days')::date,
      (now() - interval '10 days')
    );
    
    -- Criar Fatura Paga (Mês passado)
    INSERT INTO public.invoices (unit_id, lead_id, amount, status, due_date, paid_at, created_at)
    VALUES (
      v_unit_id, v_lead_id, 129.90, 'paid', 
      (now() - interval '35 days')::date, 
      (now() - interval '34 days')::date,
      (now() - interval '40 days')
    );

    -- Criar Check-ins (5 a 15 check-ins aleatórios nos últimos 30 dias)
    FOR j IN 1..(5 + floor(random() * 10)) LOOP
      INSERT INTO public.check_ins (unit_id, lead_id, checked_in_at)
      VALUES (v_unit_id, v_lead_id, now() - (random() * 30 || ' days')::interval);
    END LOOP;
  END LOOP;

  -- 3. Gerar 10 Alunos INADIMPLENTES (Faturas atrasadas)
  FOR i IN 1..10 LOOP
    IF v_users IS NOT NULL AND array_length(v_users, 1) > 0 THEN
        v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];
    ELSE
        v_user_id := NULL;
    END IF;

    INSERT INTO public.leads (unit_id, full_name, email, phone, status, created_at, assigned_to)
    VALUES (
      v_unit_id, 
      'Aluno Devedor ' || i, 
      'devedor' || i || '@exemplo.com', 
      '1198888' || lpad(i::text, 4, '0'), 
      'ativo', -- Ainda consta como ativo no cadastro, mas financeiro ruim
      now() - (random() * 60 || ' days')::interval,
      v_user_id
    ) RETURNING id INTO v_lead_id;

    INSERT INTO public.subscriptions (unit_id, lead_id, plan_id, status, start_date, end_date, price)
    VALUES (
      v_unit_id, v_lead_id, v_plan_mensal, 'overdue', 
      (now() - interval '2 months')::date, 
      (now() + interval '1 month')::date,
      129.90
    );

    -- Fatura Vencida
    INSERT INTO public.invoices (unit_id, lead_id, amount, status, due_date, created_at)
    VALUES (
      v_unit_id, v_lead_id, 129.90, 'overdue', 
      (now() - interval '5 days')::date,
      (now() - interval '15 days')
    );
  END LOOP;

  -- 4. Gerar 15 Leads Novos (Funil de Vendas - Visitantes)
  FOR i IN 1..15 LOOP
    IF v_users IS NOT NULL AND array_length(v_users, 1) > 0 THEN
        v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];
    ELSE
        v_user_id := NULL;
    END IF;

    INSERT INTO public.leads (unit_id, full_name, email, phone, status, created_at, assigned_to)
    VALUES (
      v_unit_id, 
      'Visitante Interessado ' || i, 
      'visitante' || i || '@exemplo.com', 
      '1197777' || lpad(i::text, 4, '0'), 
      CASE floor(random() * 3)
        WHEN 0 THEN 'lead'::public.pipeline_status
        WHEN 1 THEN 'visita_agendada'::public.pipeline_status
        ELSE 'negociacao'::public.pipeline_status
      END,
      now() - (random() * 10 || ' days')::interval,
      v_user_id
    );
  END LOOP;

  -- 5. Gerar 5 Alunos Cancelados (Churn)
  FOR i IN 1..5 LOOP
    IF v_users IS NOT NULL AND array_length(v_users, 1) > 0 THEN
        v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];
    ELSE
        v_user_id := NULL;
    END IF;

    INSERT INTO public.leads (unit_id, full_name, email, phone, status, created_at, assigned_to)
    VALUES (
      v_unit_id, 
      'Ex-Aluno ' || i, 
      'churn' || i || '@exemplo.com', 
      '1196666' || lpad(i::text, 4, '0'), 
      'cancelado',
      now() - (random() * 120 || ' days')::interval,
      v_user_id
    ) RETURNING id INTO v_lead_id;

    INSERT INTO public.subscriptions (unit_id, lead_id, plan_id, status, start_date, end_date, price)
    VALUES (
      v_unit_id, v_lead_id, v_plan_mensal, 'cancelled', 
      (now() - interval '4 months')::date, 
      (now() - interval '1 month')::date, -- Cancelou mês passado
      129.90
    );
  END LOOP;

  -- 6. Inserir algumas pesquisas NPS
  FOR i IN 1..20 LOOP
    INSERT INTO public.nps_surveys (unit_id, score, comment, created_at)
    VALUES (
      v_unit_id, 
      floor(random() * 4 + 7)::int, -- Notas entre 7 e 10
      'Gosto muito da academia!',
      now() - (random() * 60 || ' days')::interval
    );
  END LOOP;

  -- 7. Inserir Logs de Atividade Recentes
  INSERT INTO public.activity_logs (unit_id, entity_type, action, description, created_at)
  VALUES 
    (v_unit_id, 'sale', 'create', 'Nova venda realizada para Aluno Ativo 1', now() - interval '2 hours'),
    (v_unit_id, 'check_in', 'create', 'Check-in realizado por Aluno Ativo 5', now() - interval '15 minutes'),
    (v_unit_id, 'lead', 'create', 'Novo lead cadastrado via Site', now() - interval '1 day'),
    (v_unit_id, 'financial', 'update', 'Fatura paga por Aluno Ativo 3', now() - interval '30 minutes');

END $$;
