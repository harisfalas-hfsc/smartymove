CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.unschedule('smartymove-billing-run') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'smartymove-billing-run');

SELECT cron.schedule(
  'smartymove-billing-run',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--6d78a54d-3c8f-41af-8a37-e779415ace84.lovable.app/api/public/hooks/billing-run',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_tZA38SVUsgBInI-4i-VKDA_zEtITFBk"}'::jsonb,
    body := '{"source":"pg_cron"}'::jsonb
  );
  $$
);