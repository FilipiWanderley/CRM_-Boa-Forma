-- SOLUÇÃO DE EMERGÊNCIA: DESATIVAR TRAVAS DE SEGURANÇA DO PERFIL
-- Execute este script para liberar a edição do perfil sem restrições

-- 1. Desativar a verificação de segurança (RLS) na tabela profiles
-- Isso remove qualquer bloqueio que esteja impedindo o salvamento
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Garantir permissões de escrita para usuários logados
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

-- 3. Garantir que a coluna avatar_url existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- 4. Reforçar (novamente) as permissões do Storage
BEGIN;
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('avatars', 'avatars', true)
  ON CONFLICT (id) DO UPDATE SET public = true;
  
  -- Remover políticas antigas de storage para evitar conflitos
  DROP POLICY IF EXISTS "Avatars Public" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars Upload" ON storage.objects;
  DROP POLICY IF EXISTS "Avatars Update" ON storage.objects;
  
  -- Criar políticas simples e diretas
  CREATE POLICY "Avatars Public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  CREATE POLICY "Avatars Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
  CREATE POLICY "Avatars Update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars');
COMMIT;
