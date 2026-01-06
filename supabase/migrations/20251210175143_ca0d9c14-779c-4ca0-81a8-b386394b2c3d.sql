-- Update the handle_new_user function to also accept 'recepcao' as a valid role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _unit_id uuid;
  _is_first_user boolean;
  _requested_role text;
  _final_role public.app_role;
BEGIN
  -- Check if this is the first user in the system
  SELECT NOT EXISTS (SELECT 1 FROM public.profiles LIMIT 1) INTO _is_first_user;
  
  -- Get the first available unit
  SELECT id INTO _unit_id FROM public.units WHERE is_active = true LIMIT 1;
  
  -- Get requested role from metadata
  _requested_role := NEW.raw_user_meta_data->>'requested_role';
  
  -- Determine the final role
  IF _is_first_user THEN
    -- First user is always gestor
    _final_role := 'gestor';
  ELSIF _requested_role IN ('aluno', 'professor', 'recepcao') THEN
    -- Accept aluno, professor or recepcao if explicitly requested
    _final_role := _requested_role::public.app_role;
  ELSE
    -- Default to aluno
    _final_role := 'aluno';
  END IF;
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, unit_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    _unit_id
  );
  
  -- Assign role
  INSERT INTO public.user_roles (user_id, role, unit_id)
  VALUES (NEW.id, _final_role, _unit_id);
  
  RETURN NEW;
END;
$$;