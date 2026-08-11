-- Add signup_at and last_sign_in_at to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS signup_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- Backfill existing data from auth.users
UPDATE public.profiles p
SET signup_at = u.created_at,
    last_sign_in_at = u.last_sign_in_at
FROM auth.users u
WHERE p.user_id = u.id;

-- Update trigger function for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, mobile, signup_at, last_sign_in_at)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
    NEW.created_at,
    NEW.last_sign_in_at
  );
  RETURN NEW;
END;
$$;

-- Create update trigger function for signin updates
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users update
CREATE OR REPLACE TRIGGER on_auth_user_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_update_user();
