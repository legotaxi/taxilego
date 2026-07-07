
-- Allow passenger of an active ride to read the assigned driver's row (for realtime location)
CREATE POLICY "Passengers view assigned driver during active ride"
ON public.drivers FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.rides r
    WHERE r.driver_id = drivers.id
      AND r.passenger_id = auth.uid()
      AND r.status IN ('accepted','arriving','in_progress')
  )
);

-- Make sure SELECT is granted (other policies depend on it too)
GRANT SELECT ON public.drivers TO authenticated;

-- Enable Realtime on drivers so passenger gets live location updates
ALTER TABLE public.drivers REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.drivers;
