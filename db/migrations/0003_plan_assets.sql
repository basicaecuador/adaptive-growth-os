-- Add generated assets storage and production approval to content_plan_items
ALTER TABLE content_plan_items
  ADD COLUMN IF NOT EXISTS generated_assets JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS production_approved BOOLEAN NOT NULL DEFAULT FALSE;

-- Create public storage bucket for generated plan assets (images/videos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-assets', 'plan-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read assets (public URLs)
CREATE POLICY IF NOT EXISTS "plan-assets public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'plan-assets');

-- Allow service role to upload/manage assets (API routes use service role key)
CREATE POLICY IF NOT EXISTS "plan-assets service write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'plan-assets');

CREATE POLICY IF NOT EXISTS "plan-assets service update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'plan-assets');
