-- ============================================================
-- SEED TEAM MEMBERS
-- Idempotent: safe to run multiple times
-- Password for all users: NAVOteam2025!
-- ============================================================

-- Ensure pgcrypto is available for crypt/gen_salt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- AUTH USERS (Daniel, Samuel, Pelumi are new)
-- Ayomide and Widom already exist as test users — ON CONFLICT DO NOTHING
-- ============================================================
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at, confirmation_token
)
VALUES
  -- Ayomide (already exists — will be skipped)
  (
    '00000000-0000-0000-0000-000000000000',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'authenticated',
    'authenticated',
    'ayomide@navo.ng',
    crypt('NAVOteam2025!', gen_salt('bf')),
    now(), now(), now(),
    encode(gen_random_bytes(32), 'hex')
  ),
  -- Daniel (new)
  (
    '00000000-0000-0000-0000-000000000000',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'authenticated',
    'authenticated',
    'daniel@navo.ng',
    crypt('NAVOteam2025!', gen_salt('bf')),
    now(), now(), now(),
    encode(gen_random_bytes(32), 'hex')
  ),
  -- Widom (already exists — will be skipped)
  (
    '00000000-0000-0000-0000-000000000000',
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'authenticated',
    'authenticated',
    'widom@navo.ng',
    crypt('NAVOteam2025!', gen_salt('bf')),
    now(), now(), now(),
    encode(gen_random_bytes(32), 'hex')
  ),
  -- Samuel (new)
  (
    '00000000-0000-0000-0000-000000000000',
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'authenticated',
    'authenticated',
    'samuel@navo.ng',
    crypt('NAVOteam2025!', gen_salt('bf')),
    now(), now(), now(),
    encode(gen_random_bytes(32), 'hex')
  ),
  -- Pelumi (new)
  (
    '00000000-0000-0000-0000-000000000000',
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'authenticated',
    'authenticated',
    'pelumi@navo.ng',
    crypt('NAVOteam2025!', gen_salt('bf')),
    now(), now(), now(),
    encode(gen_random_bytes(32), 'hex')
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- PROFILES
-- Ayomide = owner, everyone else = member
-- ============================================================
INSERT INTO profiles (id, email, name, role_id, created_at, updated_at)
VALUES
  -- Ayomide — Owner
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'ayomide@navo.ng',
    'Ayomide',
    (SELECT id FROM roles WHERE name = 'owner'),
    now(), now()
  ),
  -- Daniel — Member
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'daniel@navo.ng',
    'Daniel',
    (SELECT id FROM roles WHERE name = 'member'),
    now(), now()
  ),
  -- Widom — Member
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'widom@navo.ng',
    'Widom',
    (SELECT id FROM roles WHERE name = 'member'),
    now(), now()
  ),
  -- Samuel — Member
  (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'samuel@navo.ng',
    'Samuel',
    (SELECT id FROM roles WHERE name = 'member'),
    now(), now()
  ),
  -- Pelumi — Member
  (
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'pelumi@navo.ng',
    'Pelumi',
    (SELECT id FROM roles WHERE name = 'member'),
    now(), now()
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role_id = EXCLUDED.role_id,
  updated_at = now();
