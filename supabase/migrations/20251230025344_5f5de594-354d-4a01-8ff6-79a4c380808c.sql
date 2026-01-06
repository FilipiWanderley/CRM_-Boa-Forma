
-- =====================================================
-- MIGRATION: PRD MASTER UNIFICADO - Expansão do Schema
-- =====================================================

-- 1. EXERCISES - Adicionar suporte a exercícios globais vs por tenant
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.units(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_global boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS equipment text,
ADD COLUMN IF NOT EXISTS difficulty text CHECK (difficulty IN ('iniciante', 'intermediario', 'avancado'));

COMMENT ON COLUMN public.exercises.is_global IS 'Se true, exercício disponível para todas as academias';
COMMENT ON COLUMN public.exercises.unit_id IS 'Se não global, pertence a esta academia';

-- 2. WORKOUT_EXERCISES - Adicionar carga e técnica avançada
ALTER TABLE public.workout_exercises
ADD COLUMN IF NOT EXISTS load_value numeric,
ADD COLUMN IF NOT EXISTS load_unit text DEFAULT 'kg' CHECK (load_unit IN ('kg', 'lb', 'bodyweight')),
ADD COLUMN IF NOT EXISTS advanced_technique text CHECK (advanced_technique IN ('drop_set', 'bi_set', 'tri_set', 'super_set', 'rest_pause', 'piramide', 'fst7', 'giant_set'));

-- 3. PHYSICAL_ASSESSMENTS - Adicionar protocolos e campos adicionais
ALTER TABLE public.physical_assessments
ADD COLUMN IF NOT EXISTS protocol text CHECK (protocol IN ('pollock_3', 'pollock_7', 'guedes', 'jackson_pollock', 'faulkner', 'petroski')),
ADD COLUMN IF NOT EXISTS triceps_skinfold numeric,
ADD COLUMN IF NOT EXISTS subscapular_skinfold numeric,
ADD COLUMN IF NOT EXISTS suprailiac_skinfold numeric,
ADD COLUMN IF NOT EXISTS abdominal_skinfold numeric,
ADD COLUMN IF NOT EXISTS thigh_skinfold numeric,
ADD COLUMN IF NOT EXISTS chest_skinfold numeric,
ADD COLUMN IF NOT EXISTS axillary_skinfold numeric,
ADD COLUMN IF NOT EXISTS neck numeric,
ADD COLUMN IF NOT EXISTS forearm_right numeric,
ADD COLUMN IF NOT EXISTS forearm_left numeric,
ADD COLUMN IF NOT EXISTS resting_heart_rate integer,
ADD COLUMN IF NOT EXISTS blood_pressure_systolic integer,
ADD COLUMN IF NOT EXISTS blood_pressure_diastolic integer,
ADD COLUMN IF NOT EXISTS vo2_max numeric,
ADD COLUMN IF NOT EXISTS flexibility_test numeric,
ADD COLUMN IF NOT EXISTS lean_mass numeric;

-- 4. SUBSCRIPTIONS - Adicionar tipo de cobrança
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'manual' CHECK (billing_type IN ('manual', 'recurrent', 'installment')),
ADD COLUMN IF NOT EXISTS installments integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS current_installment integer DEFAULT 0;

-- 5. UNITS (Tenants) - Adicionar configurações de inadimplência e tema
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS allow_entry_if_overdue boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS overdue_grace_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS inactivity_alert_days integer DEFAULT 7,
ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'America/Sao_Paulo';

-- 6. PLANS - Adicionar horários permitidos
ALTER TABLE public.plans
ADD COLUMN IF NOT EXISTS allowed_hours_start time,
ADD COLUMN IF NOT EXISTS allowed_hours_end time,
ADD COLUMN IF NOT EXISTS access_type text DEFAULT 'unlimited' CHECK (access_type IN ('unlimited', 'limited_hours', 'limited_days')),
ADD COLUMN IF NOT EXISTS max_access_per_day integer;

-- 7. NOVA TABELA: workout_logs - Para aluno marcar exercícios concluídos
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    workout_exercise_id uuid NOT NULL REFERENCES public.workout_exercises(id) ON DELETE CASCADE,
    completed_at timestamp with time zone NOT NULL DEFAULT now(),
    sets_completed integer,
    reps_completed text,
    load_used numeric,
    notes text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alunos can manage their own workout logs"
ON public.workout_logs
FOR ALL
USING (
    lead_id IN (
        SELECT l.id FROM leads l
        WHERE l.profile_id = (
            SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
        )
    )
    AND has_role(auth.uid(), 'aluno')
);

CREATE POLICY "Staff can view workout logs"
ON public.workout_logs
FOR SELECT
USING (
    unit_id = get_user_unit_id(auth.uid())
    AND (
        has_role(auth.uid(), 'gestor')
        OR has_role(auth.uid(), 'professor')
    )
);

-- 8. NOVA TABELA: payment_methods - Tokenização de cartão
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'pix')),
    token text,
    last_four_digits text,
    brand text,
    holder_name text,
    expiry_month integer,
    expiry_year integer,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    gateway text DEFAULT 'stripe',
    gateway_customer_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage payment methods"
ON public.payment_methods
FOR ALL
USING (
    unit_id = get_user_unit_id(auth.uid())
    AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

CREATE POLICY "Alunos can view their payment methods"
ON public.payment_methods
FOR SELECT
USING (
    lead_id IN (
        SELECT l.id FROM leads l
        WHERE l.profile_id = (
            SELECT p.id FROM profiles p WHERE p.user_id = auth.uid() LIMIT 1
        )
    )
    AND has_role(auth.uid(), 'aluno')
);

-- 9. NOVA TABELA: recurring_billing_logs - Log de cobranças recorrentes
CREATE TABLE IF NOT EXISTS public.recurring_billing_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
    invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
    payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
    status text NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    amount numeric NOT NULL,
    attempt_number integer DEFAULT 1,
    gateway_response jsonb,
    error_message text,
    next_retry_at timestamp with time zone,
    processed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recurring_billing_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view billing logs"
ON public.recurring_billing_logs
FOR SELECT
USING (
    unit_id = get_user_unit_id(auth.uid())
    AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'recepcao'))
);

-- 10. INVOICES - Adicionar campos para recorrência
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id),
ADD COLUMN IF NOT EXISTS is_recurring boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS recurring_billing_log_id uuid,
ADD COLUMN IF NOT EXISTS installment_number integer;

-- 11. CHECK_INS - Adicionar status de acesso
ALTER TABLE public.check_ins
ADD COLUMN IF NOT EXISTS access_status text DEFAULT 'granted' CHECK (access_status IN ('granted', 'denied', 'grace_period')),
ADD COLUMN IF NOT EXISTS denial_reason text;

-- 12. Índices para performance
CREATE INDEX IF NOT EXISTS idx_workout_logs_lead ON public.workout_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_workout ON public.workout_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_date ON public.workout_logs(completed_at);
CREATE INDEX IF NOT EXISTS idx_payment_methods_lead ON public.payment_methods(lead_id);
CREATE INDEX IF NOT EXISTS idx_recurring_billing_subscription ON public.recurring_billing_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_exercises_global ON public.exercises(is_global) WHERE is_global = true;
CREATE INDEX IF NOT EXISTS idx_exercises_unit ON public.exercises(unit_id) WHERE unit_id IS NOT NULL;

-- 13. Atualizar RLS de exercises para suportar globais e por tenant
DROP POLICY IF EXISTS "Anyone can view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Staff can manage exercises" ON public.exercises;

CREATE POLICY "Anyone can view global exercises"
ON public.exercises
FOR SELECT
USING (is_global = true);

CREATE POLICY "Users can view their unit exercises"
ON public.exercises
FOR SELECT
USING (
    unit_id = get_user_unit_id(auth.uid())
);

CREATE POLICY "Staff can manage unit exercises"
ON public.exercises
FOR ALL
USING (
    (unit_id = get_user_unit_id(auth.uid()) OR is_global = true)
    AND (has_role(auth.uid(), 'gestor') OR has_role(auth.uid(), 'professor'))
);

-- 14. Habilitar realtime nas novas tabelas
ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_logs;
