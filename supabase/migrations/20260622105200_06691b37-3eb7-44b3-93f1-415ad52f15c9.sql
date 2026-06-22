
CREATE POLICY "Anyone can read exercise gifs"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'exercise-gifs');

CREATE POLICY "Authenticated can upload exercise gifs"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'exercise-gifs');

CREATE POLICY "Authenticated can update exercise gifs"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'exercise-gifs')
  WITH CHECK (bucket_id = 'exercise-gifs');

CREATE POLICY "Authenticated can delete exercise gifs"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'exercise-gifs');
