CREATE TABLE IF NOT EXISTS public.system_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL DEFAULT 'false'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read system settings" ON public.system_settings;
CREATE POLICY "Anyone can read system settings"
ON public.system_settings FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can insert system settings" ON public.system_settings;
CREATE POLICY "Admins can insert system settings"
ON public.system_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

DROP POLICY IF EXISTS "Admins can update system settings" ON public.system_settings;
CREATE POLICY "Admins can update system settings"
ON public.system_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com')
WITH CHECK (public.has_role(auth.uid(), 'admin') OR lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

DROP POLICY IF EXISTS "Admins can delete system settings" ON public.system_settings;
CREATE POLICY "Admins can delete system settings"
ON public.system_settings FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

DROP TRIGGER IF EXISTS set_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER set_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.system_settings (setting_key, setting_value, description)
VALUES ('free_access_mode', 'false'::jsonb, 'When true, all content is free for signed-in users and every purchase/premium reference is hidden (App Store submission mode)')
ON CONFLICT (setting_key) DO NOTHING;