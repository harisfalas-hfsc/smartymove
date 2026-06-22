
CREATE TABLE public.exercises (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  body_part TEXT,
  equipment TEXT,
  target TEXT,
  secondary_muscles TEXT[] DEFAULT '{}',
  instructions TEXT[] DEFAULT '{}',
  gif_url TEXT,
  description TEXT,
  difficulty TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.exercises TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exercises are publicly readable"
  ON public.exercises FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert exercises"
  ON public.exercises FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update exercises"
  ON public.exercises FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete exercises"
  ON public.exercises FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX exercises_body_part_idx ON public.exercises (body_part);
CREATE INDEX exercises_target_idx ON public.exercises (target);
