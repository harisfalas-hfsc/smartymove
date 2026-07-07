
CREATE TYPE public.smarty_area AS ENUM ('ankle','knee','hip','low_back','shoulder','elbow','wrist');
CREATE TYPE public.smarty_category AS ENUM ('mobility','stability','strength');

CREATE TABLE public.smartymove_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  area public.smarty_area NOT NULL,
  category public.smarty_category NOT NULL,
  also_helps text[] NOT NULL DEFAULT '{}',
  addresses text NOT NULL,
  equipment text NOT NULL DEFAULT 'Bodyweight',
  level text NOT NULL DEFAULT 'Beginner',
  sort_order integer NOT NULL DEFAULT 0,
  approved boolean NOT NULL DEFAULT true,
  source_exercise_id text REFERENCES public.exercises(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, area, category)
);

CREATE INDEX smartymove_exercises_area_cat_idx
  ON public.smartymove_exercises (area, category, sort_order);

GRANT SELECT ON public.smartymove_exercises TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.smartymove_exercises TO authenticated;
GRANT ALL ON public.smartymove_exercises TO service_role;

ALTER TABLE public.smartymove_exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SmartyMove library is publicly readable"
  ON public.smartymove_exercises FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert smartymove exercises"
  ON public.smartymove_exercises FOR INSERT
  TO authenticated
  WITH CHECK (lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

CREATE POLICY "Admin can update smartymove exercises"
  ON public.smartymove_exercises FOR UPDATE
  TO authenticated
  USING (lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com')
  WITH CHECK (lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

CREATE POLICY "Admin can delete smartymove exercises"
  ON public.smartymove_exercises FOR DELETE
  TO authenticated
  USING (lower((auth.jwt() ->> 'email')) = 'harisfalas@gmail.com');

CREATE TRIGGER smartymove_exercises_set_updated_at
  BEFORE UPDATE ON public.smartymove_exercises
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
