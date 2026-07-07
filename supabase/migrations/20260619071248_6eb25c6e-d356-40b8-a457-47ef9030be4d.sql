
-- Admins can manage all vehicles (insert/update/delete)
CREATE POLICY "Admins manage all vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can view vehicles (needed so passengers can see car of their ride's driver)
CREATE POLICY "Authenticated can view vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (true);
