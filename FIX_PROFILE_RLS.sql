-- SCRIPT PARA CORRIGIR PERMISSÃO DE SALVAR PERFIL (FOTO)

-- 1. Habilitar segurança na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Gestores can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Gestores can update all profiles" ON public.profiles;

-- 3. CRIAR POLÍTICAS DE ACESSO

-- A) VISUALIZAÇÃO (SELECT)
-- Usuário vê o próprio perfil OU Gestores veem todos
CREATE POLICY "Profiles visibility"
ON public.profiles FOR SELECT
TO authenticated
USING ( 
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'gestor'
  )
);

-- B) ATUALIZAÇÃO (UPDATE) - ESSENCIAL PARA A FOTO
-- Usuário edita o próprio perfil OU Gestores editam todos
CREATE POLICY "Profiles update"
ON public.profiles FOR UPDATE
TO authenticated
USING ( 
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'gestor'
  )
)
WITH CHECK ( 
  user_id = auth.uid() 
  OR 
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'gestor'
  )
);

-- C) INSERÇÃO (INSERT)
-- Usuários podem criar seu próprio perfil (necessário no cadastro)
CREATE POLICY "Profiles insert"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK ( user_id = auth.uid() );
