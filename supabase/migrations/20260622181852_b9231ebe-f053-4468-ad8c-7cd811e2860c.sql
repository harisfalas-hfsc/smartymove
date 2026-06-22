DROP POLICY IF EXISTS "Anyone can insert exercises (admin tool)" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can update exercises (admin tool)" ON public.exercises;
DROP POLICY IF EXISTS "Anyone can delete exercises (admin tool)" ON public.exercises;

CREATE POLICY "Admin emails can insert exercises"
ON public.exercises
FOR INSERT
TO authenticated
WITH CHECK (lower(auth.jwt() ->> 'email') IN ('harisfalas@gmail.com', 'harispalas@gmail.com'));

CREATE POLICY "Admin emails can update exercises"
ON public.exercises
FOR UPDATE
TO authenticated
USING (lower(auth.jwt() ->> 'email') IN ('harisfalas@gmail.com', 'harispalas@gmail.com'))
WITH CHECK (lower(auth.jwt() ->> 'email') IN ('harisfalas@gmail.com', 'harispalas@gmail.com'));

CREATE POLICY "Admin emails can delete exercises"
ON public.exercises
FOR DELETE
TO authenticated
USING (lower(auth.jwt() ->> 'email') IN ('harisfalas@gmail.com', 'harispalas@gmail.com'));