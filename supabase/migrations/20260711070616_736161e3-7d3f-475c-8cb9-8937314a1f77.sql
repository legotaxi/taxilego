ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS last_accuracy numeric,
  ADD COLUMN IF NOT EXISTS last_speed numeric,
  ADD COLUMN IF NOT EXISTS last_heading numeric,
  ADD COLUMN IF NOT EXISTS last_location_update timestamptz;