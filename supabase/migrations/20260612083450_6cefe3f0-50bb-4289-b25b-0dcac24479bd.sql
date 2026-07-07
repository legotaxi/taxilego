
ALTER TABLE public.drivers
  ADD COLUMN IF NOT EXISTS bi_url text,
  ADD COLUMN IF NOT EXISTS license_url text,
  ADD COLUMN IF NOT EXISTS criminal_record_url text,
  ADD COLUMN IF NOT EXISTS photo_url text;

DROP POLICY IF EXISTS "Drivers upload own docs" ON storage.objects;
CREATE POLICY "Drivers upload own docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'driver-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Drivers update own docs" ON storage.objects;
CREATE POLICY "Drivers update own docs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Drivers and admins read docs" ON storage.objects;
CREATE POLICY "Drivers and admins read docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  )
);

DROP POLICY IF EXISTS "Admins delete docs" ON storage.objects;
CREATE POLICY "Admins delete docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'driver-docs'
  AND public.has_role(auth.uid(), 'admin')
);
