CREATE TABLE IF NOT EXISTS brand_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'product_owner', 'content')),
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(brand_id, user_id)
);

CREATE INDEX IF NOT EXISTS brand_members_brand_id_idx ON brand_members(brand_id);
CREATE INDEX IF NOT EXISTS brand_members_user_id_idx ON brand_members(user_id);
