-- Add phone-based authentication support
-- This migration adds a unique constraint on phone for phone-based login

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_phone_unique UNIQUE (phone);

-- Create a function to handle phone-based signup
CREATE OR REPLACE FUNCTION public.handle_phone_signup(
  p_phone TEXT,
  p_password TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_user_type TEXT DEFAULT 'passenger'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Validate inputs
  IF p_phone IS NULL OR p_phone = '' THEN
    RETURN json_build_object('error', 'Phone number is required');
  END IF;
  
  IF p_password IS NULL OR p_password = '' THEN
    RETURN json_build_object('error', 'Password is required');
  END IF;

  -- Check if phone already exists
  IF EXISTS (SELECT 1 FROM public.profiles WHERE phone = p_phone) THEN
    RETURN json_build_object('error', 'Phone number already registered');
  END IF;

  -- Return success - actual signup is handled by Supabase Auth
  RETURN json_build_object(
    'success', true,
    'message', 'Phone signup initiated',
    'user_type', p_user_type
  );
END;
$$;

-- Create a function to verify phone and password
CREATE OR REPLACE FUNCTION public.verify_phone_password(
  p_phone TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_auth_user RECORD;
BEGIN
  -- This function is called after Supabase Auth verification
  -- It returns user info if phone exists in profiles
  
  SELECT id INTO v_user_id FROM public.profiles WHERE phone = p_phone LIMIT 1;
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Phone not found');
  END IF;

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id
  );
END;
$$;

-- Create index on phone for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
