# SmartyMove Corrective Exercise Engine v1

Encodes your spec literally. Exercises are NEVER generated — only picked from the seven libraries you listed, by area + category + phase ratio.

## 1. Hard-coded curated libraries (your exact lists)

New file `src/lib/corrective/libraries.ts`. Seven areas × three categories, names verbatim from your prompt:

**Ankle**
- Mobility: Knee To Wall, Ankle Rockers, Calf Stretch, Soleus Stretch, Ankle Circles, Toe Elevation Stretch, Dorsiflexion Mobilization, Heel Raises, Tibialis Raises, Foot Rolling
- Stability: Single Leg Balance, Single Leg Balance Eyes Closed, Star Balance Reach, Clock Reach, Single Leg RDL Reach, Tandem Walk, Heel Walk, Toe Walk, Bosu Balance, Lateral Hops
- Strength: Calf Raises, Single Leg Calf Raises, Tibialis Raises, Split Squat, Reverse Lunge, Step Ups, Farmer Carry, Walking Lunges, Skater Step, Sled Push

**Knee**
- Mobility: Quad Stretch, Hamstring Stretch, Calf Stretch, Knee Flexion Mobilization, Heel Slides, Assisted Deep Squat Hold, Couch Stretch, Adductor Rockback, Hip Flexor Stretch, Ankle Mobility Drill
- Stability: Single Leg Balance, Step Down Hold, Split Squat Hold, Wall Sit, Terminal Knee Control, Lateral Reach, Clock Reach, Single Leg Sit To Stand, Balance Pad Hold, March Hold
- Strength: Sit To Stand, Goblet Squat, Split Squat, Reverse Lunge, Step Ups, Bulgarian Split Squat, Wall Sit, Spanish Squat, Deadlift, Farmer Carry

**Hip**
- Mobility: 90/90 Hip Stretch, Hip Rotations, Figure Four Stretch, Adductor Rockback, Frog Stretch, Hip Flexor Stretch, World's Greatest Stretch, Cossack Mobility, Glute Stretch, Leg Swings
- Stability: Single Leg Balance, Bird Dog, Dead Bug, Side Plank, Glute Bridge Hold, Hip Airplane, March Hold, Single Leg Reach, Pallof Press, Split Stance Hold
- Strength: Glute Bridge, Hip Thrust, Split Squat, Step Up, Deadlift, Single Leg RDL, Goblet Squat, Farmer Carry, Lateral Lunge, Walking Lunge

**Low Back** (Push Ups explicitly BLOCKED)
- Mobility: Cat Cow, Child Pose, Open Book, Pelvic Tilt, Hip Flexor Stretch, 90/90 Hip Stretch, Hamstring Mobility, Thoracic Rotation, Adductor Rockback, Deep Squat Hold
- Stability: Bird Dog, Dead Bug, Side Plank, Front Plank, Pallof Press, Glute Bridge Hold, March Hold, Bear Hold, Suitcase Carry, Single Leg Balance
- Strength: Glute Bridge, Hip Thrust, Farmer Carry, Suitcase Carry, Step Up, Split Squat, Goblet Squat, Deadlift Progressions, Reverse Lunge, Sled Push

**Shoulder**
- Mobility: Wall Slides, Thread The Needle, Open Book, Arm Circles, Band Dislocates, Thoracic Rotation, Child Pose Reach, Pec Stretch, Lat Stretch, Sleeper Stretch
- Stability: Scapular Push Up, Y Hold, T Hold, Wall Slide Hold, Bottom Up Carry, Farmer Carry, Dead Bug Reach, Bird Dog Reach, Side Plank Reach, Band External Rotation
- Strength: Row, Face Pull, Band Pull Apart, Landmine Press, Half Kneeling Press, Carry Variations, TRX Row, Incline Push Up, Dumbbell Press, Shoulder Press

**Elbow**
- Mobility: Wrist Flexor Stretch, Wrist Extensor Stretch, Forearm Rotations, Elbow Flexion Extension, Nerve Glides, Wall Mobility, Hand Open Close, Grip Mobility, Finger Extensions, Wrist Circles
- Stability: Grip Hold, Farmer Carry, Bottom Up Carry, Dead Hang, Suitcase Carry, Band Holds, Wrist Isometrics, Towel Grip, Plank Hold, Push Up Hold
- Strength: Row, Hammer Curl, Reverse Curl, Farmer Carry, Wrist Curl, Wrist Extension, Grip Crush, TRX Row, Band Row, Carry Variations

**Wrist**
- Mobility: Wrist Circles, Palm Stretch, Reverse Palm Stretch, Wrist Flexion Stretch, Wrist Extension Stretch, Finger Mobility, Prayer Stretch, Table Wrist Rocks, Forearm Rotation, Hand Open Close
- Stability: Quadruped Weight Shift, Wrist Isometric Hold, Farmer Carry, Bottom Up Carry, Wall Push Hold, Bear Hold, Plank Hold, Side Plank Hold, Grip Hold, Towel Hold
- Strength: Wrist Curl, Reverse Wrist Curl, Farmer Carry, Grip Crush, Plate Pinch, Band Extension, Rice Bucket Work, Hammer Rotation, Dead Hang, Carry Variations

Each entry stored as `{ canonical, keywords[] }` so the resolver can match it to the closest row in the `public.exercises` library (exact name → keyword score → skip if no GIF). Push Ups are on a blocklist for the Low Back area.

## 2. Mandatory user flow (already partially built)

- **Readiness questionnaire** — already exists at `/onboarding/questionnaire`. Add the missing fields: numbness, night pain, unexplained symptoms (currently merged into one "red flags" switch — split into three). Red flag → warning banner, do NOT block.
- **Disclaimer** — already exists; keep, requires acceptance.
- **Pain area selection** — `/onboarding/joints`. Enforce **max 2 areas** (currently unbounded). "None" allowed.
- **Movement assessment** — `/app/screen.run` already runs the 5 tests (Squat, Hip Hinge, Single Leg Balance, Split Stance Reach, Overhead Reach). Verify all 5 are present; add any missing.
- **Goal selection** — already exists with your 5 options.

## 3. Phase engine (`src/lib/corrective/phase.ts`)

Derive from `programStartDate` (set on first goal completion; backfilled to `createdAt` for existing users):

| Weeks | Phase    | Mob | Stab | Str |
|-------|----------|-----|------|-----|
| 0–1   | Restore  | 70% | 20%  | 10% |
| 2–5   | Build    | 30% | 40%  | 30% |
| 6+    | Perform  | 20% | 30%  | 50% |

For a 7-exercise daily routine the slot counts become Restore 5/1/1, Build 2/3/2, Perform 1/2/4.

Nobody graduates — phase keeps advancing forever.

## 4. Routine engine (`src/lib/corrective/engine.ts`) — replaces current slot picker

Inputs: user's pain areas (max 2; if "none", default areas from goal), phase ratios, library rows from `public.exercises`.

1. Compute slot counts from phase ratios.
2. Walk Mobility → Stability → Strength. For each slot, alternate across the user's areas and pull the next un-used curated name from that area + category.
3. Resolve curated name → library row (exact → keyword score, body-weight preferred, must have GIF). If no resolution, log to admin warnings and skip to next curated entry.
4. Daily order is seeded by `(userId, date)` so the routine is stable for the day and rotates day-to-day.
5. Return `RoutineItem[]` tagged with `category` (mobility/stability/strength) and `area` for UI grouping.

Wire `useMicroRoutine` in `src/lib/exercises.ts` to delegate to this engine. Keep the existing signed-URL flow and `ExerciseSheet` popup unchanged.

## 5. Retest cycle (`src/lib/corrective/retest.ts`)

- After every screen session, store `nextRetestDate = +14d`.
- Home shows a "Retest due" CTA when reached.
- On retest completion, compare to previous session and render a Progress Report card: delta per sub-score (Mobility / Stability / Balance / Quality / Strength), Movement Score trend, Movement Age delta.
- If overall improvement ≥ threshold, surface a "Ready for next goal?" suggestion (e.g. "Your knee function improved — ready to start a running pathway?"). User can accept → updates `goal`.

## 6. UI changes

- `src/routes/app/index.tsx` — header shows **Phase · Week N** and ratio chips (Mob/Stab/Str). Routine list shows category badge + area badge per item.
- `src/routes/app/program.tsx` — phase banner; weekly view tagged by category.
- `src/routes/app/progress.tsx` — Movement Score trend chart + last retest delta.
- `src/routes/onboarding/joints.tsx` — enforce max 2 selections.
- `src/routes/onboarding/questionnaire.tsx` — split the single "red flags" switch into Numbness / Night pain / Unexplained symptoms.
- `src/routes/admin.exercises.tsx` — list curated names that failed to resolve to a DB row so you can fix them.

## 7. Data

No schema changes. We reuse the existing `public.exercises` table (already populated with GIFs). Unresolved curated names surface in the admin page; those will be a follow-up DB seed, not part of this build.

## Files

**New**: `src/lib/corrective/libraries.ts`, `engine.ts`, `phase.ts`, `retest.ts`; `src/components/PhaseHeader.tsx`, `ProgressReport.tsx`, `RetestCTA.tsx`.

**Edited**: `src/lib/store.ts` (add `programStartDate`, `nextRetestDate`, `painAreas` limit helper), `src/lib/exercises.ts` (delegate to engine), `src/routes/app/index.tsx`, `program.tsx`, `progress.tsx`, `onboarding/questionnaire.tsx`, `onboarding/joints.tsx`, `admin.exercises.tsx`.

## Out of scope (explicit)

- Seeding missing curated movements into `public.exercises` (surfaced in admin, fixed in a follow-up turn).
- Equipment filter UI.
- Custom user-uploaded GIFs.
