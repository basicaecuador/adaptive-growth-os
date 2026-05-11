-- Brand configuration v2: new fields per requirements
ALTER TABLE brands
  ADD COLUMN IF NOT EXISTS descripcion TEXT,
  ADD COLUMN IF NOT EXISTS concepto_comunicacional TEXT,
  ADD COLUMN IF NOT EXISTS mandatorios_generales TEXT[],
  ADD COLUMN IF NOT EXISTS puntos_clave TEXT[],
  ADD COLUMN IF NOT EXISTS tono_estilo TEXT,
  ADD COLUMN IF NOT EXISTS redes_disponibles TEXT[],
  ADD COLUMN IF NOT EXISTS competidores TEXT[],
  ADD COLUMN IF NOT EXISTS fechas_importantes TEXT[];
