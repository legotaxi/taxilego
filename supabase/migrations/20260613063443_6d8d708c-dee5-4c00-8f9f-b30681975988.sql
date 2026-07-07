
-- Update trigger so admin phone gets admin role only (no passenger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_emails text[] := ARRAY['lubatechnology@gmail.com','gomesshekinah@gmail.com','repairlubatec@gmail.com'];
  admin_phones text[] := ARRAY['921346544'];
  user_phone text;
  is_admin boolean := false;
BEGIN
  user_phone := NEW.raw_user_meta_data->>'phone';

  IF NEW.email IS NOT NULL AND lower(NEW.email) = ANY(admin_emails) THEN
    is_admin := true;
  END IF;
  IF user_phone IS NOT NULL AND user_phone = ANY(admin_phones) THEN
    is_admin := true;
  END IF;

  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    user_phone,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  IF is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger')
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
