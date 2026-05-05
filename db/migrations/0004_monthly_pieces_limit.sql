-- Add monthly piece limit to brands
ALTER TABLE brands ADD COLUMN IF NOT EXISTS monthly_pieces_limit INTEGER DEFAULT NULL;

-- Track content expansion requests (when plan exceeds contracted pieces)
CREATE TABLE IF NOT EXISTS content_expansion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES content_plans(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  included_pieces INTEGER NOT NULL,
  required_pieces INTEGER NOT NULL,
  additional_pieces INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  requested_by UUID NOT NULL REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE content_expansion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view expansion requests"
  ON content_expansion_requests FOR SELECT
  USING (true);

CREATE POLICY "Members can create expansion requests"
  ON content_expansion_requests FOR INSERT
  WITH CHECK (auth.uid() = requested_by);

CREATE POLICY "Members can update expansion requests"
  ON content_expansion_requests FOR UPDATE
  USING (true);
