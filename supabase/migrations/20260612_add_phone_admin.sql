-- Add support for admin phone number in the database
-- This migration ensures that phone number 921346544 can be assigned as admin

-- Update handle_new_user to auto-grant admin role for specific emails OR phone numbers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  admin_emails text[] := ARRAY['lubatechnology@gmail.com','gomesshekinah@gmail.com','repairlubatec@gmail.com'];
  admin_phones text[] := ARRAY['921346544'];
  phone_from_meta text;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'passenger')
    ON CONFLICT DO NOTHING;
  
  -- Check if email matches admin emails
  IF lower(NEW.email) = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  
  -- Check if phone matches admin phones
  phone_from_meta := NEW.raw_user_meta_data->>'phone';
  IF phone_from_meta IS NOT NULL AND phone_from_meta = ANY(admin_phones) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Backfill admin role for any existing users matching the admin phone
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'admin'::app_role
FROM public.profiles p
WHERE p.phone = '921346544'
ON CONFLICT DO NOTHING;

-- Create a function that promotes admin phones on every sign-in (idempotent)
CREATE OR REPLACE FUNCTION public.ensure_admin_for_phone()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_phones text[] := ARRAY['921346544'];
  user_phone text;
BEGIN
  -- Get the phone from the user's profile
  SELECT phone INTO user_phone FROM public.profiles WHERE id = NEW.id;
  
  IF user_phone IS NOT NULL AND user_phone = ANY(admin_phones) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
      ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for phone-based admin promotion on sign-in
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_signin') THEN
    CREATE TRIGGER on_auth_user_signin
      AFTER UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.ensure_admin_for_phone();
  END IF;
END $$;
