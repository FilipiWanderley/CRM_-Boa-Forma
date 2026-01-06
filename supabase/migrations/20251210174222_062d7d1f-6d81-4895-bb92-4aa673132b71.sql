-- Atualizar função handle_new_user para aceitar role via metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_unit_id uuid := 'a0000000-0000-0000-0000-000000000001';
  is_first_user boolean;
  requested_role text;
BEGIN
  -- Verifica se é o primeiro usuário
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Pega a role solicitada do metadata (se existir)
  requested_role := NEW.raw_user_meta_data->>'requested_role';
  
  -- Cria o perfil vinculado à unidade padrão
  INSERT INTO public.profiles (user_id, full_name, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_unit_id
  );
  
  -- Atribui role baseado na lógica
  IF is_first_user THEN
    -- Primeiro usuário sempre é gestor
    INSERT INTO public.user_roles (user_id, role, unit_id)
    VALUES (NEW.id, 'gestor', default_unit_id);
  ELSIF requested_role IN ('aluno', 'professor') THEN
    -- Roles permitidas via link de cadastro
    INSERT INTO public.user_roles (user_id, role, unit_id)
    VALUES (NEW.id, requested_role::app_role, default_unit_id);
  ELSIF requested_role IS NULL THEN
    -- Se não especificou role, assume aluno como padrão
    INSERT INTO public.user_roles (user_id, role, unit_id)
    VALUES (NEW.id, 'aluno', default_unit_id);
  END IF;
  -- Nota: gestor e recepcao precisam ser atribuídos manualmente
  
  RETURN NEW;
END;
$$;