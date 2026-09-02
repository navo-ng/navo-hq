CREATE TABLE IF NOT EXISTS email_digests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE email_digests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage digests" ON email_digests USING (true);
