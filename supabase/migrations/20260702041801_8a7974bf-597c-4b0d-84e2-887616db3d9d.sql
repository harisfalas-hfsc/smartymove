
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS scan_credits int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS scans_purchased int NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.has_scan_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE((SELECT scan_credits > 0 FROM public.profiles WHERE id = _user_id), false)
    OR EXISTS (
      SELECT 1 FROM public.subscriptions
      WHERE user_id = _user_id
        AND (
          (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
          OR (status = 'canceled' AND current_period_end > now())
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.consume_scan_credit(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  has_sub boolean;
  affected int;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND (
        (status IN ('active','trialing','past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  ) INTO has_sub;
  IF has_sub THEN RETURN true; END IF;

  UPDATE public.profiles
     SET scan_credits = scan_credits - 1,
         updated_at = now()
   WHERE id = _user_id AND scan_credits > 0;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.grant_scan_credits(_user_id uuid, _credits int)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.profiles
     SET scan_credits = scan_credits + _credits,
         scans_purchased = scans_purchased + _credits,
         updated_at = now()
   WHERE id = _user_id;
$$;

GRANT EXECUTE ON FUNCTION public.has_scan_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_scan_credit(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.grant_scan_credits(uuid, int) TO service_role;
