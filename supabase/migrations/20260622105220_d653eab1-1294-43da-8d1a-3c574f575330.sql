
DROP POLICY IF EXISTS "Authenticated users can insert exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can update exercises" ON public.exercises;
DROP POLICY IF EXISTS "Authenticated users can delete exercises" ON public.exercises;

CREATE POLICY "Anyone can insert exercises (admin tool)"
  ON public.exercises FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update exercises (admin tool)"
  ON public.exercises FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete exercises (admin tool)"
  ON public.exercises FOR DELETE TO anon, authenticated USING (true);

GRANT INSERT, UPDATE, DELETE ON public.exercises TO anon;

DROP POLICY IF EXISTS "Authenticated can upload exercise gifs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update exercise gifs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete exercise gifs" ON storage.objects;

CREATE POLICY "Anyone can upload exercise gifs (admin tool)"
  ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'exercise-gifs');
CREATE POLICY "Anyone can update exercise gifs (admin tool)"
  ON storage.objects FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'exercise-gifs') WITH CHECK (bucket_id = 'exercise-gifs');
CREATE POLICY "Anyone can delete exercise gifs (admin tool)"
  ON storage.objects FOR DELETE TO anon, authenticated
  USING (bucket_id = 'exercise-gifs');
