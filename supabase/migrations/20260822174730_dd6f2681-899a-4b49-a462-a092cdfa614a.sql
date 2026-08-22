DROP POLICY IF EXISTS "Anyone can insert exercises (admin tool)" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can update exercises (admin tool)" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can delete exercises (admin tool)" ON public.exercises;

REVOKE INSERT, UPDATE, DELETE ON public.exercises FROM anon;
GRANT SELECT ON public.exercises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;