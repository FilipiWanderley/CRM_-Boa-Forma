-- ==============================================================================
-- SCRIPT PARA REGISTRAR/PROMOVER UM USUÁRIO COMO ALUNO
-- ==============================================================================
-- 1. O usuário deve se cadastrar na aplicação primeiro.
-- 2. Este script garante que o usuário tenha a função de 'aluno'.
-- ==============================================================================

DO $$
DECLARE
  v_target_email TEXT := 'moraes@gmail.com'; -- <--- Email solicitado
  v_user_id UUID;
  v_unit_id UUID;
BEGIN
  -- 1. Buscar ID do usuário pelo email
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_target_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado. Por favor, cadastre-se na aplicação primeiro.', v_target_email;
  END IF;

  -- 2. Buscar ou criar uma unidade padrão
  SELECT id INTO v_unit_id FROM public.units LIMIT 1;
  
  IF v_unit_id IS NULL THEN
    INSERT INTO public.units (name, is_active) VALUES ('Unidade Matriz', true) RETURNING id INTO v_unit_id;
  END IF;

  -- 3. Garantir que o perfil existe e está vinculado à unidade
  -- Se o perfil já existe (criado pelo trigger), atualizamos a unidade.
  UPDATE public.profiles 
  SET unit_id = v_unit_id 
  WHERE user_id = v_user_id;

  -- Se não existir (caso raro), criamos.
  INSERT INTO public.profiles (user_id, unit_id, full_name)
  VALUES (v_user_id, v_unit_id, 'Aluno (Nome a definir)')
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Atribuir permissão de ALUNO
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (v_user_id, 'aluno', v_unit_id)
  ON CONFLICT (user_id, role, unit_id) DO NOTHING;
  
  RAISE NOTICE 'SUCESSO: Usuário % agora tem acesso como ALUNO.', v_target_email;
END $$;
