-- Criar unidade padrão
INSERT INTO public.units (id, name, email, phone, address)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Unidade Principal',
  'contato@academia.com',
  '(11) 99999-9999',
  'Endereço da Unidade Principal'
) ON CONFLICT (id) DO NOTHING;

-- Atualizar função handle_new_user para vincular à unidade e atribuir gestor ao primeiro usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_unit_id uuid := 'a0000000-0000-0000-0000-000000000001';
  is_first_user boolean;
BEGIN
  -- Verifica se é o primeiro usuário
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO is_first_user;
  
  -- Cria o perfil vinculado à unidade padrão
  INSERT INTO public.profiles (user_id, full_name, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_unit_id
  );
  
  -- Se for o primeiro usuário, atribui role de gestor
  IF is_first_user THEN
    INSERT INTO public.user_roles (user_id, role, unit_id)
    VALUES (NEW.id, 'gestor', default_unit_id);
  END IF;
  
  RETURN NEW;
END;
$$;