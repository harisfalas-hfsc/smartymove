-- Remove the free first scan. Every scan requires a paid purchase.
ALTER TABLE public.profiles ALTER COLUMN scan_credits SET DEFAULT 0;

-- Revoke unused free credits from users who never purchased a scan.
-- Paid users (scans_purchased > 0) keep whatever credits they still have.
UPDATE public.profiles
   SET scan_credits = 0,
       updated_at = now()
 WHERE scans_purchased = 0
   AND scan_credits > 0;