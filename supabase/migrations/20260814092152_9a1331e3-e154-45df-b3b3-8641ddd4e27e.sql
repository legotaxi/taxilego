-- Lock down SECURITY DEFINER functions: no anon execution, and no direct
-- execution of trigger/bootstrap helpers by signed-in users.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_ride_payment(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_wallet_topup(numeric, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.confirm_wallet_topup(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.reject_wallet_withdrawal(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.rate_driver(uuid, integer) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.request_wallet_withdrawal(numeric, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.ensure_admin_for_email() FROM anon, authenticated, public;

-- Vehicles: remove blanket read access for every signed-in user.
DROP POLICY IF EXISTS "Authenticated can view vehicles" ON public.vehicles;

CREATE POLICY "Owners and ride counterparts can view vehicles"
ON public.vehicles
FOR SELECT
TO authenticated
USING (
  auth.uid() = owner_id
  OR EXISTS (
    SELECT 1 FROM public.drivers d
    WHERE d.vehicle_id = vehicles.id AND d.id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.rides r
    JOIN public.drivers d ON d.id = r.driver_id
    WHERE d.vehicle_id = vehicles.id
      AND r.passenger_id = auth.uid()
  )
);