
CREATE OR REPLACE FUNCTION public.consume_scan_credit(_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  affected int;
BEGIN
  UPDATE public.profiles
     SET scan_credits = scan_credits - 1,
         updated_at = now()
   WHERE id = _user_id AND scan_credits > 0;
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.has_scan_access(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE((SELECT scan_credits > 0 FROM public.profiles WHERE id = _user_id), false);
$function$;
