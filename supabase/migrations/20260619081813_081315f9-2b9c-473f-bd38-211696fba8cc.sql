
-- 1) Chat messages between passenger and driver of a ride
CREATE TABLE public.ride_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('passenger','driver')),
  text TEXT NOT NULL CHECK (length(text) BETWEEN 1 AND 1000),
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_ride_messages_ride ON public.ride_messages(ride_id, created_at);

GRANT SELECT, INSERT, UPDATE ON public.ride_messages TO authenticated;
GRANT ALL ON public.ride_messages TO service_role;

ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ride participants view messages"
  ON public.ride_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

CREATE POLICY "Ride participants send messages"
  ON public.ride_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

CREATE POLICY "Recipients mark messages read"
  ON public.ride_messages FOR UPDATE TO authenticated
  USING (
    sender_id <> auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.rides r
      WHERE r.id = ride_id
        AND (r.passenger_id = auth.uid() OR r.driver_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
ALTER TABLE public.ride_messages REPLICA IDENTITY FULL;

-- 2) Ride payment + cashback bookkeeping
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS cashback_kz NUMERIC(12,2) NOT NULL DEFAULT 0;

-- 3) Atomic payment confirmation: debits passenger wallet if needed,
-- credits driver wallet, credits 10% cashback bonus to passenger.
-- Idempotent: only acts when paid_at IS NULL.
CREATE OR REPLACE FUNCTION public.confirm_ride_payment(_ride_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r            public.rides%ROWTYPE;
  caller       UUID := auth.uid();
  fare         NUMERIC(12,2);
  cashback     NUMERIC(12,2);
  pass_balance NUMERIC(12,2);
BEGIN
  SELECT * INTO r FROM public.rides WHERE id = _ride_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Corrida não encontrada');
  END IF;

  IF caller IS NULL OR (caller <> r.passenger_id AND caller <> r.driver_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão');
  END IF;

  IF r.status <> 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Corrida ainda não terminou');
  END IF;

  IF r.paid_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'already_paid', true,
      'fare_kz', r.fare_kz, 'cashback_kz', r.cashback_kz);
  END IF;

  fare := r.fare_kz;
  cashback := ROUND(fare * 0.10, 2);

  -- Wallet payment: passenger must have funds
  IF r.payment_method = 'wallet' THEN
    SELECT wallet_balance_kz INTO pass_balance
      FROM public.profiles WHERE id = r.passenger_id FOR UPDATE;
    IF pass_balance < fare THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Saldo insuficiente na carteira');
    END IF;
    UPDATE public.profiles
      SET wallet_balance_kz = wallet_balance_kz - fare
      WHERE id = r.passenger_id;
    INSERT INTO public.transactions(user_id, ride_id, type, amount_kz, description, method)
      VALUES (r.passenger_id, r.id, 'ride_payment', -fare,
              'Pagamento de corrida', 'wallet');
  ELSE
    INSERT INTO public.transactions(user_id, ride_id, type, amount_kz, description, method)
      VALUES (r.passenger_id, r.id, 'ride_payment', -fare,
              'Pagamento de corrida', r.payment_method);
  END IF;

  -- Credit driver (90% of fare; platform keeps 10%)
  IF r.driver_id IS NOT NULL THEN
    UPDATE public.profiles
      SET wallet_balance_kz = wallet_balance_kz + ROUND(fare * 0.90, 2)
      WHERE id = r.driver_id;
    INSERT INTO public.transactions(user_id, ride_id, type, amount_kz, description, method)
      VALUES (r.driver_id, r.id, 'ride_earning', ROUND(fare * 0.90, 2),
              'Ganho da corrida (90%)', r.payment_method);
  END IF;

  -- 10% cashback bonus to passenger (always, regardless of payment method)
  UPDATE public.profiles
    SET wallet_balance_kz = wallet_balance_kz + cashback
    WHERE id = r.passenger_id;
  INSERT INTO public.transactions(user_id, ride_id, type, amount_kz, description, method)
    VALUES (r.passenger_id, r.id, 'bonus', cashback,
            'Cashback 10% — uso interno no app', 'wallet');

  UPDATE public.rides
    SET paid_at = now(), cashback_kz = cashback
    WHERE id = _ride_id;

  RETURN jsonb_build_object('ok', true, 'fare_kz', fare, 'cashback_kz', cashback);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_ride_payment(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.confirm_ride_payment(UUID) TO authenticated;

-- 4) Rating: passenger sets driver_rating on their own ride (RLS already allows update on own ride; add explicit fn to keep contract clear)
CREATE OR REPLACE FUNCTION public.rate_driver(_ride_id UUID, _stars INT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.rides%ROWTYPE;
BEGIN
  IF _stars < 1 OR _stars > 5 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Classificação inválida');
  END IF;
  SELECT * INTO r FROM public.rides WHERE id = _ride_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Corrida não encontrada');
  END IF;
  IF auth.uid() <> r.passenger_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Sem permissão');
  END IF;
  IF r.status <> 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Corrida ainda não terminou');
  END IF;

  UPDATE public.rides SET driver_rating = _stars WHERE id = _ride_id;

  -- Recompute driver aggregate rating
  IF r.driver_id IS NOT NULL THEN
    UPDATE public.drivers d
       SET rating = COALESCE((
         SELECT ROUND(AVG(driver_rating)::numeric, 2)
           FROM public.rides
          WHERE driver_id = r.driver_id AND driver_rating IS NOT NULL
       ), 0)
     WHERE d.id = r.driver_id;
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE ALL ON FUNCTION public.rate_driver(UUID, INT) FROM public;
GRANT EXECUTE ON FUNCTION public.rate_driver(UUID, INT) TO authenticated;
