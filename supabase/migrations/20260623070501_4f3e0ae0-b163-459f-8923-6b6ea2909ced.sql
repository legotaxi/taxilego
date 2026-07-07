
-- ==========================================================
-- SUPPORT TICKETS
-- ==========================================================
CREATE TABLE public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own tickets" ON public.support_tickets
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users create own tickets" ON public.support_tickets
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admins update tickets" ON public.support_tickets
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_support_tickets_updated_at
  BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================
-- WALLET TOPUP REQUESTS
-- ==========================================================
CREATE TABLE public.wallet_topup_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kz NUMERIC(12,2) NOT NULL CHECK (amount_kz > 0),
  method TEXT NOT NULL CHECK (method IN ('mcx_express','reference','cash_deposit')),
  reference_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wallet_topup_requests TO authenticated;
GRANT ALL ON public.wallet_topup_requests TO service_role;

ALTER TABLE public.wallet_topup_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own topups" ON public.wallet_topup_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users create own topups" ON public.wallet_topup_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER set_topup_updated_at
  BEFORE UPDATE ON public.wallet_topup_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================
-- WALLET WITHDRAWAL REQUESTS
-- ==========================================================
CREATE TABLE public.wallet_withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_kz NUMERIC(12,2) NOT NULL CHECK (amount_kz > 0),
  bank_iban TEXT NOT NULL,
  bank_holder TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wallet_withdrawal_requests TO authenticated;
GRANT ALL ON public.wallet_withdrawal_requests TO service_role;

ALTER TABLE public.wallet_withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users see own withdrawals" ON public.wallet_withdrawal_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "users create own withdrawals" ON public.wallet_withdrawal_requests
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER set_withdrawal_updated_at
  BEFORE UPDATE ON public.wallet_withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================================
-- FUNCTION: request_wallet_topup
-- ==========================================================
CREATE OR REPLACE FUNCTION public.request_wallet_topup(
  _amount_kz NUMERIC, _method TEXT, _reference_code TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller UUID := auth.uid();
  new_id UUID;
BEGIN
  IF caller IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Não autenticado'); END IF;
  IF _amount_kz <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Valor inválido'); END IF;
  INSERT INTO public.wallet_topup_requests(user_id, amount_kz, method, reference_code)
    VALUES (caller, _amount_kz, _method, _reference_code)
    RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok',true,'id',new_id);
END; $$;

-- ==========================================================
-- FUNCTION: request_wallet_withdrawal (debits balance immediately)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.request_wallet_withdrawal(
  _amount_kz NUMERIC, _bank_iban TEXT, _bank_holder TEXT
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller UUID := auth.uid();
  bal NUMERIC;
  new_id UUID;
BEGIN
  IF caller IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Não autenticado'); END IF;
  IF _amount_kz <= 0 THEN RETURN jsonb_build_object('ok',false,'error','Valor inválido'); END IF;
  SELECT wallet_balance_kz INTO bal FROM public.profiles WHERE id = caller FOR UPDATE;
  IF bal IS NULL OR bal < _amount_kz THEN
    RETURN jsonb_build_object('ok',false,'error','Saldo insuficiente');
  END IF;
  UPDATE public.profiles SET wallet_balance_kz = wallet_balance_kz - _amount_kz WHERE id = caller;
  INSERT INTO public.wallet_withdrawal_requests(user_id, amount_kz, bank_iban, bank_holder)
    VALUES (caller, _amount_kz, _bank_iban, _bank_holder)
    RETURNING id INTO new_id;
  INSERT INTO public.transactions(user_id, type, amount_kz, description, method)
    VALUES (caller, 'withdrawal', -_amount_kz, 'Pedido de saque para ' || _bank_iban, 'bank');
  RETURN jsonb_build_object('ok',true,'id',new_id);
END; $$;

-- ==========================================================
-- FUNCTION: confirm_wallet_topup (admin only)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.confirm_wallet_topup(_topup_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller UUID := auth.uid();
  t public.wallet_topup_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(caller, 'admin') THEN
    RETURN jsonb_build_object('ok',false,'error','Sem permissão');
  END IF;
  SELECT * INTO t FROM public.wallet_topup_requests WHERE id = _topup_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Pedido não encontrado'); END IF;
  IF t.status <> 'pending' THEN RETURN jsonb_build_object('ok',false,'error','Já processado'); END IF;
  UPDATE public.profiles SET wallet_balance_kz = wallet_balance_kz + t.amount_kz WHERE id = t.user_id;
  INSERT INTO public.transactions(user_id, type, amount_kz, description, method)
    VALUES (t.user_id, 'topup', t.amount_kz, 'Recarga confirmada', t.method);
  UPDATE public.wallet_topup_requests
    SET status='confirmed', processed_by=caller, processed_at=now()
    WHERE id = _topup_id;
  RETURN jsonb_build_object('ok',true);
END; $$;

-- ==========================================================
-- FUNCTION: reject_wallet_withdrawal (admin only, refunds)
-- ==========================================================
CREATE OR REPLACE FUNCTION public.reject_wallet_withdrawal(_id UUID) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller UUID := auth.uid();
  w public.wallet_withdrawal_requests%ROWTYPE;
BEGIN
  IF NOT public.has_role(caller, 'admin') THEN
    RETURN jsonb_build_object('ok',false,'error','Sem permissão');
  END IF;
  SELECT * INTO w FROM public.wallet_withdrawal_requests WHERE id = _id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Pedido não encontrado'); END IF;
  IF w.status <> 'pending' AND w.status <> 'processing' THEN
    RETURN jsonb_build_object('ok',false,'error','Já finalizado');
  END IF;
  UPDATE public.profiles SET wallet_balance_kz = wallet_balance_kz + w.amount_kz WHERE id = w.user_id;
  INSERT INTO public.transactions(user_id, type, amount_kz, description, method)
    VALUES (w.user_id, 'refund', w.amount_kz, 'Devolução de saque rejeitado', 'bank');
  UPDATE public.wallet_withdrawal_requests
    SET status='rejected', processed_by=caller, processed_at=now()
    WHERE id = _id;
  RETURN jsonb_build_object('ok',true);
END; $$;
