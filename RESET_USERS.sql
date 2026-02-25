-- ==============================================================================
-- LIMPEZA TOTAL DE USUÁRIOS
-- Rode este script no SQL Editor do Supabase para apagar TODOS os usuários.
-- CUIDADO: Isso também apagará perfis, tarefas e leads vinculados a esses usuários.
-- ==============================================================================

-- Apaga todos os usuários da tabela de autenticação.
-- Devido ao "ON DELETE CASCADE" que configuramos antes, isso limpará automaticamente:
-- 1. A tabela public.profiles
-- 2. A tabela public.user_roles
-- 3. Qualquer outro dado vinculado diretamente ao ID do usuário
DELETE FROM auth.users;
