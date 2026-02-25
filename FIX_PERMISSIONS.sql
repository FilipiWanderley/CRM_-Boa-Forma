-- =========================================================
-- CORREÇÃO DE PERMISSÕES E ATUALIZAÇÃO DE AUTOMAÇÃO
-- Rode este script no SQL Editor do Supabase
-- =========================================================

-- 1. Garante que a Unidade Padrão existe (evita erro de chave estrangeira)
INSERT INTO public.units (id, name, email, phone)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Academia Boa Forma - Matriz', 'contato@academiaboaforma.com.br', '(11) 99999-9999')
ON CONFLICT (id) DO NOTHING;

-- 2. Atualiza a automação (Trigger) para que NOVOS usuários recebam o perfil correto
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_unit_id UUID := 'a0000000-0000-0000-0000-000000000001';
  req_role public.app_role;
BEGIN
  -- Cria o perfil
  INSERT INTO public.profiles (user_id, full_name, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_unit_id
  );

  -- Tenta pegar o role do cadastro
  BEGIN
    req_role := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
  EXCEPTION WHEN OTHERS THEN
    req_role := 'aluno';
  END;
  
  IF req_role IS NULL THEN
    req_role := 'aluno';
  END IF;

  -- Insere na tabela de permissões (Isso que estava faltando!)
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (NEW.id, req_role, default_unit_id);

  RETURN NEW;
END;
$$;

-- 3. CORRIGE O SEU USUÁRIO ATUAL (Dá permissão de Gestor para quem está sem)
INSERT INTO public.user_roles (user_id, role, unit_id)
SELECT id, 'gestor', 'a0000000-0000-0000-0000-000000000001'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.users.id);
