-- Phase 1: new funnel stages, percentage distribution, audiences, richer product, per-item metadata

-- content_plans: funnel distribution (percentages) + audiences + total pieces
ALTER TABLE content_plans
  ADD COLUMN IF NOT EXISTS funnel_distribution JSONB,
  ADD COLUMN IF NOT EXISTS audiences JSONB,
  ADD COLUMN IF NOT EXISTS total_pieces INTEGER;

-- content_plan_items: category, production type, conversion channel, target audience
ALTER TABLE content_plan_items
  ADD COLUMN IF NOT EXISTS content_category TEXT,
  ADD COLUMN IF NOT EXISTS production_type TEXT,
  ADD COLUMN IF NOT EXISTS conversion_channel TEXT,
  ADD COLUMN IF NOT EXISTS target_audience TEXT;
