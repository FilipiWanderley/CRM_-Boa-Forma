-- ==============================================================================
-- SCRIPT DE POPULAÇÃO DE DADOS (MOCK DATA) PARA DASHBOARD
-- ==============================================================================
-- Este script gera dados fictícios realistas para simular o funcionamento do Dashboard.
-- Ele cria: Planos, Alunos (Leads), Assinaturas, Faturas, Check-ins e Histórico.
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
    v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];

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
    v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];

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
    v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];

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
    v_user_id := v_users[floor(random() * array_length(v_users, 1) + 1)];

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
