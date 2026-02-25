-- ==============================================================================
-- SCRIPT PARA TORNAR UM USUÁRIO ADMINISTRADOR (GESTOR)
-- ==============================================================================
-- 1. Cadastre-se na aplicação normalmente através da tela de Login/Cadastro.
-- 2. Substitua 'SEU_EMAIL_AQUI' abaixo pelo e-mail que você usou no cadastro.
-- 3. Rode este script no SQL Editor do Supabase.
-- ==============================================================================

DO $$
DECLARE
  v_target_email TEXT := 'filipiwms@gmail.com'; -- <--- COLOQUE SEU EMAIL AQUI
  v_user_id UUID;
  v_unit_id UUID;
BEGIN
  -- 1. Buscar ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado. Cadastre-se primeiro na aplicação.', v_target_email;
  END IF;

  -- 2. Buscar ou criar uma unidade padrão
  SELECT id INTO v_unit_id FROM public.units LIMIT 1;
  
  IF v_unit_id IS NULL THEN
    INSERT INTO public.units (name, is_active) VALUES ('Unidade Matriz', true) RETURNING id INTO v_unit_id;
  END IF;

  -- 3. Garantir que o perfil existe
  INSERT INTO public.profiles (user_id, unit_id, full_name)
  VALUES (v_user_id, v_unit_id, 'Administrador')
  ON CONFLICT (user_id) DO UPDATE SET unit_id = v_unit_id;

  -- 4. Atribuir permissão de GESTOR (Admin)
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (v_user_id, 'gestor', v_unit_id)
  ON CONFLICT (user_id, role, unit_id) DO NOTHING;
  
  RAISE NOTICE 'SUCESSO: Usuário % agora é um GESTOR (Administrador). Atualize a página.', v_target_email;
END $$;
