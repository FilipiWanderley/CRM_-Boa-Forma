-- ==========================================
-- SCRIPT DE CORREÇÃO DEFINITIVA (FINAL FIX)
-- ==========================================

-- 1. Garantir que existe uma Unidade Padrão
INSERT INTO public.units (id, name, email, phone, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Academia Boa Forma - Matriz',
  'contato@academiaboaforma.com.br',
  '(11) 99999-9999',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Corrigir TODOS os Perfis existentes (atribuir Unidade Padrão)
UPDATE public.profiles
SET unit_id = 'a0000000-0000-0000-0000-000000000001'
WHERE unit_id IS NULL;

-- 3. Limpar roles antigas/incorretas para garantir estado limpo
DELETE FROM public.user_roles;

-- 4. Atribuir permissão de GESTOR para TODOS os usuários atuais
-- (Isso garante que seu usuário atual vire Gestor imediatamente)
INSERT INTO public.user_roles (user_id, role, unit_id)
SELECT 
  id as user_id, 
  'gestor'::public.app_role as role,
  'a0000000-0000-0000-0000-000000000001' as unit_id
FROM auth.users;

-- 5. Atualizar a função de cadastro para SEMPRE incluir a Unidade
-- Isso previne o erro de acontecer com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_unit_id uuid := 'a0000000-0000-0000-0000-000000000001';
  requested_role public.app_role;
BEGIN
  -- 1. Criar Perfil (COM Unit ID obrigatório)
  INSERT INTO public.profiles (user_id, full_name, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    default_unit_id
  );

  -- 2. Definir Role
  -- Tenta pegar do metadata, senão define padrão
  BEGIN
    IF NEW.raw_user_meta_data->>'requested_role' IS NOT NULL THEN
       requested_role := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
    ELSE
       requested_role := 'aluno'; -- Padrão seguro
    END IF;
  EXCEPTION WHEN OTHERS THEN
    requested_role := 'aluno';
  END;

  -- Se for o PRIMEIRO usuário do sistema, força Gestor
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'gestor') THEN
    requested_role := 'gestor';
  END IF;

  -- 3. Inserir Role (COM Unit ID obrigatório)
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (NEW.id, requested_role, default_unit_id);

  RETURN NEW;
END;
$$;

-- 6. Garantir Políticas de Segurança (RLS) permissivas para leitura de Roles
-- Remove política antiga se existir para recriar correta
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Gestores can manage roles" ON public.user_roles;

-- Cria política que PERMITE o usuário ver sua própria role
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Garante que RLS está ativo
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
