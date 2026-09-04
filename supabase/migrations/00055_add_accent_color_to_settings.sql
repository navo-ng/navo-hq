-- Add accent_color to user_settings if not exists
INSERT INTO user_settings (user_id, key, value)
SELECT id, 'accent_color', '"blue"' 
FROM auth.users 
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings WHERE key = 'accent_color'
)
ON CONFLICT DO NOTHING;
