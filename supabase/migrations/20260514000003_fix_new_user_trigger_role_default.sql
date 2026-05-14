-- Allow role to be null so new OAuth users are directed to the role-select
-- screen instead of being silently assigned 'customer'.
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;

-- Update trigger: stop defaulting new users to 'customer'.
-- Also populate full_name and avatar_url from OAuth provider metadata.
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')), ''),
    NULL  -- role is always chosen by the user on the role-select screen
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
