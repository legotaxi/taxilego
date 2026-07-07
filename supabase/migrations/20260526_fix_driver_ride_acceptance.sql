-- Fix: Allow drivers to accept unassigned rides
-- This migration adds a policy that permits drivers to update rides with status='requested' and driver_id=NULL

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Drivers update assigned rides" ON public.rides;

-- Add new policies for drivers:
-- 1. Drivers can update rides they are assigned to (original behavior)
CREATE POLICY "Drivers update assigned rides" ON public.rides
  FOR UPDATE TO authenticated 
  USING (auth.uid() = driver_id)
  WITH CHECK (auth.uid() = driver_id);

-- 2. Drivers can accept unassigned rides (new behavior for ride acceptance)
CREATE POLICY "Drivers accept unassigned rides" ON public.rides
  FOR UPDATE TO authenticated
  USING (
    status = 'requested' 
    AND driver_id IS NULL
    AND public.has_role(auth.uid(), 'driver')
  )
  WITH CHECK (
    status = 'accepted'
    AND driver_id = auth.uid()
  );

-- Ensure drivers can view unassigned rides to accept them
DROP POLICY IF EXISTS "Drivers view assigned rides" ON public.rides;

CREATE POLICY "Drivers view assigned rides" ON public.rides
  FOR SELECT TO authenticated 
  USING (
    auth.uid() = driver_id 
    OR (
      status = 'requested' 
      AND driver_id IS NULL 
      AND public.has_role(auth.uid(), 'driver')
    )
  );
