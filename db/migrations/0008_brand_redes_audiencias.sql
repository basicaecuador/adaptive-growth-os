-- redes_disponibles was added as TEXT[] in 0007 (no data yet), migrate to JSONB for structured {red, usuario}
ALTER TABLE brands DROP COLUMN IF EXISTS redes_disponibles;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS redes_disponibles JSONB DEFAULT '[]'::jsonb;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS audiencias_marca JSONB DEFAULT '[]'::jsonb;
