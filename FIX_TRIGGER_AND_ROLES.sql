-- Drop existing trigger and function to ensure clean state
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Recreate the function with role assignment logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.app_role;
BEGIN
  -- 1. Create Profile
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- 2. Handle Role Assignment
  -- Check if a specific role was requested in metadata
  IF NEW.raw_user_meta_data->>'requested_role' IS NOT NULL THEN
    BEGIN
      requested_role := (NEW.raw_user_meta_data->>'requested_role')::public.app_role;
      
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, requested_role);
    EXCEPTION WHEN OTHERS THEN
      -- Fallback if invalid role requested
      NULL;
    END;
  END IF;

  -- 3. Safety Net for First User (Admin/Gestor)
  -- If no role was assigned (either no request or invalid) AND this is the only user, make them 'gestor'
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = NEW.id) THEN
    -- Optional: Logic to auto-make the first user a gestor if the table is empty
    -- For now, we rely on the requested_role or manual assignment
    NULL; 
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- IMMEDIATE FIX: Assign 'gestor' role to any existing user who has no role
-- This fixes the user you just created who is stuck in "Aguardando atribuição"
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'gestor'::public.app_role
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles WHERE user_id = auth.users.id
);
