-- ============================================================
-- FIX: Ensure owner role is assigned
-- ============================================================
-- This fixes cases where the owner's profile was created but
-- the assign_first_user_owner() trigger didn't fire (e.g.,
-- when profiles were manually re-created or seeded).

UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'owner' LIMIT 1)
WHERE email = 'ayomideoyelakin10@gmail.com'
  AND (role_id IS NULL OR role_id != (SELECT id FROM roles WHERE name = 'owner' LIMIT 1));

-- Also ensure any profile without a role gets 'member' by default
UPDATE profiles
SET role_id = (SELECT id FROM roles WHERE name = 'member' LIMIT 1)
WHERE role_id IS NULL;
