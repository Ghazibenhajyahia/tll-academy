-- ============================================================
-- Admin functions (run in Supabase SQL Editor)
-- ============================================================

-- Create user (proper password hashing, no signUp needed)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_city text DEFAULT '',
  p_confirm_email boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_user_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
    RAISE EXCEPTION 'Email already registered';
  END IF;

  new_user_id := gen_random_uuid();

  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    aud, role, confirmation_token
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    CASE WHEN p_confirm_email THEN now() ELSE NULL END,
    now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'city', COALESCE(p_city, '')),
    'authenticated', 'authenticated',
    ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    created_at, updated_at, last_sign_in_at
  ) VALUES (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object('sub', new_user_id::text, 'email', p_email),
    'email',
    new_user_id::text,
    now(), now(), now()
  );

  INSERT INTO public.profiles (id, name, email, city)
  VALUES (new_user_id, p_name, p_email, COALESCE(p_city, ''))
  ON CONFLICT (id) DO UPDATE SET name = p_name, email = p_email, city = COALESCE(p_city, '');

  RETURN new_user_id;
END;
$$;

-- Confirm email
CREATE OR REPLACE FUNCTION public.admin_confirm_email(p_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.users
  SET email_confirmed_at = now(), updated_at = now()
  WHERE email = p_email AND email_confirmed_at IS NULL;
END;
$$;

-- Reset password
CREATE OR REPLACE FUNCTION public.admin_reset_password(p_user_id text, p_new_password text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := p_user_id::uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  UPDATE auth.users
  SET encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
      updated_at = now()
  WHERE id = uid;
END;
$$;

-- Delete user (full cascade)
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := p_user_id::uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  IF uid = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account';
  END IF;
  DELETE FROM public.session_results WHERE user_id = uid;
  DELETE FROM public.profiles WHERE id = uid;
  DELETE FROM auth.sessions WHERE user_id = uid;
  DELETE FROM auth.refresh_tokens WHERE user_id = uid::text;
  DELETE FROM auth.mfa_factors WHERE user_id = uid;
  DELETE FROM auth.identities WHERE user_id = uid;
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

NOTIFY pgrst, 'reload schema';
