-- SCRIPT CORRETIVO FINAL PARA STORAGE (AVATARS E FAVICONS)

-- 1. Garantir que o bucket 'avatars' existe e é público
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Remover TODAS as políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Give me access to avatars" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar Delete Access" ON storage.objects;

-- 3. Criar políticas ABRANGENTES para 'avatars'
-- Isso resolve problemas de upload de perfil E upload de favicon (que usa o mesmo bucket)

-- LEITURA: Qualquer pessoa (público) pode ver os arquivos
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- UPLOAD: Usuários autenticados podem fazer upload de qualquer arquivo no bucket avatars
CREATE POLICY "Avatar Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- ATUALIZAÇÃO: Usuários autenticados podem atualizar arquivos no bucket avatars
CREATE POLICY "Avatar Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'avatars' );

-- EXCLUSÃO: Usuários autenticados podem deletar arquivos no bucket avatars
CREATE POLICY "Avatar Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'avatars' );
