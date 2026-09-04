-- Update trigger to assign 'member' role to new users by default
CREATE OR REPLACE FUNCTION assign_first_user_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  owner_role_id UUID;
  member_role_id UUID;
  user_count BIGINT;
BEGIN
  IF NEW.role_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('assign_first_user_owner'));

  SELECT id INTO owner_role_id FROM roles WHERE name = 'owner' LIMIT 1;
  SELECT id INTO member_role_id FROM roles WHERE name = 'member' LIMIT 1;

  SELECT COUNT(*) INTO user_count FROM profiles WHERE role_id IS NOT NULL;

  IF user_count = 0 AND owner_role_id IS NOT NULL THEN
    UPDATE profiles SET role_id = owner_role_id WHERE id = NEW.id;
  ELSIF member_role_id IS NOT NULL THEN
    UPDATE profiles SET role_id = member_role_id WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
