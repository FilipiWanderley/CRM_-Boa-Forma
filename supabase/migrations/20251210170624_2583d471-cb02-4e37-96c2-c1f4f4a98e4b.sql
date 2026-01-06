
-- =============================================
-- FITNESS TOP CRM/ERP - FASE 1: FUNDAÇÃO
-- =============================================

-- 1. ENUM para roles do sistema
CREATE TYPE public.app_role AS ENUM ('gestor', 'recepcao', 'professor', 'aluno');

-- 2. ENUM para status do pipeline
CREATE TYPE public.pipeline_status AS ENUM ('lead', 'visita_agendada', 'negociacao', 'ativo', 'inativo', 'cancelado');

-- 3. ENUM para tipo de interação
CREATE TYPE public.interaction_type AS ENUM ('ligacao', 'whatsapp', 'email', 'presencial', 'sistema');

-- =============================================
-- TABELAS PRINCIPAIS
-- =============================================

-- 4. Tabela de Unidades (Tenants) - preparado para multi-unidade
CREATE TABLE public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Tabela de Perfis de Usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  gender TEXT,
  address TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de Roles (separada do profiles para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, unit_id)
);

-- 7. Tabela de Leads/Clientes
CREATE TABLE public.leads (
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
  source TEXT, -- origem: indicação, instagram, google, etc
  status pipeline_status NOT NULL DEFAULT 'lead',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- responsável
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tabela de Anamnese (Ficha de Saúde)
CREATE TABLE public.anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL UNIQUE,
  objectives TEXT[], -- objetivos: emagrecimento, hipertrofia, etc
  medical_conditions TEXT[], -- condições médicas
  medications TEXT,
  injuries TEXT,
  physical_activity_history TEXT,
  smoker BOOLEAN DEFAULT false,
  alcohol_consumption TEXT,
  sleep_quality TEXT,
  stress_level TEXT,
  observations TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabela de Histórico de Interações
CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- quem fez a interação
  type interaction_type NOT NULL,
  description TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ, -- para follow-ups agendados
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tabela de Tarefas
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMPTZ,
  priority TEXT DEFAULT 'medium', -- low, medium, high
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- FUNÇÕES AUXILIARES
-- =============================================

-- 11. Função para verificar role (security definer para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 12. Função para obter unit_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT unit_id
  FROM public.profiles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 13. Função para verificar se usuário pertence à unidade
CREATE OR REPLACE FUNCTION public.user_belongs_to_unit(_user_id UUID, _unit_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND unit_id = _unit_id
  )
$$;

-- 14. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- =============================================
-- TRIGGERS
-- =============================================

-- Triggers para updated_at
CREATE TRIGGER set_updated_at_units
  BEFORE UPDATE ON public.units
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_leads
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_anamnesis
  BEFORE UPDATE ON public.anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tasks
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- POLICIES: Units
CREATE POLICY "Users can view their unit"
  ON public.units FOR SELECT
  TO authenticated
  USING (public.user_belongs_to_unit(auth.uid(), id) OR public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Gestores can manage units"
  ON public.units FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'));

-- POLICIES: Profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Staff can view profiles in their unit"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor')
    )
  );

-- POLICIES: User Roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gestores can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'gestor'));

-- POLICIES: Leads
CREATE POLICY "Staff can view leads in their unit"
  ON public.leads FOR SELECT
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor')
    )
  );

CREATE POLICY "Staff can insert leads"
  ON public.leads FOR INSERT
  TO authenticated
  WITH CHECK (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao')
    )
  );

CREATE POLICY "Staff can update leads"
  ON public.leads FOR UPDATE
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao')
    )
  );

CREATE POLICY "Gestores can delete leads"
  ON public.leads FOR DELETE
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND public.has_role(auth.uid(), 'gestor')
  );

-- POLICIES: Anamnesis
CREATE POLICY "Staff can view anamnesis"
  ON public.anamnesis FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND l.unit_id = public.get_user_unit_id(auth.uid())
    )
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor')
    )
  );

CREATE POLICY "Staff can manage anamnesis"
  ON public.anamnesis FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND l.unit_id = public.get_user_unit_id(auth.uid())
    )
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao')
    )
  );

-- POLICIES: Interactions
CREATE POLICY "Staff can view interactions"
  ON public.interactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND l.unit_id = public.get_user_unit_id(auth.uid())
    )
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor')
    )
  );

CREATE POLICY "Staff can create interactions"
  ON public.interactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id
      AND l.unit_id = public.get_user_unit_id(auth.uid())
    )
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor')
    )
  );

-- POLICIES: Tasks
CREATE POLICY "Staff can view tasks in their unit"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR 
      public.has_role(auth.uid(), 'professor') OR
      assigned_to = auth.uid()
    )
  );

CREATE POLICY "Staff can create tasks"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao')
    )
  );

CREATE POLICY "Staff can update tasks"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND (
      public.has_role(auth.uid(), 'gestor') OR 
      public.has_role(auth.uid(), 'recepcao') OR
      assigned_to = auth.uid()
    )
  );

CREATE POLICY "Gestores can delete tasks"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    unit_id = public.get_user_unit_id(auth.uid())
    AND public.has_role(auth.uid(), 'gestor')
  );

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Inserir unidade padrão
INSERT INTO public.units (id, name, email, phone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Academia Boa Forma - Matriz',
  'contato@academiaboaforma.com.br',
  '(11) 99999-9999'
);
