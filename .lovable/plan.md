# Dual-Angle Scanning + Reasoning Upgrade

Additive only. Existing scoring, compensation detection, decision engine, exercise library, and phase logic stay intact — no rewrites.

## PART 1 — Dual-angle scan flow (`src/lib/movement.ts`, `src/routes/app/screen.run.tsx`)

Add per-test camera-view definitions to each entry in `CORE_TESTS` and `CONDITIONAL_TESTS`:

```
views: [{ id: "side", label, silhouetteHint, detects: [...] },
        { id: "front", label, silhouetteHint, detects: [...] }]
```

Mapping:
- **Two-angle**: squat (side→front), hinge (side→front), balance (front→side, per leg), lunge (side→front, per leg), overhead (front→side), ankle_df (side→front), knee_sld (front→side), bridge_hold (side→front), wall_slide (side→front)
- **Single-angle unchanged**: hip_abd (front only), elbow_rom (front only), wrist_rom (front only)

`screen.run.tsx` becomes a per-view loop: for each test, run all views sequentially with a "Reposition" transition screen (silhouette + copy: "Great — now face the camera") between them. Each view runs its own compensation detectors; results merge into one `TestResult` with combined score = min of per-view scores and union of compensation strings. `TestResult` gains `viewFindings: { view, score, compensations }[]` (persisted; renders per-view in results).

## PART 2 — Compensation reasoning (`src/lib/corrective/decision.ts`)

Each focus template gains a `perCompensation` map keyed on the compensation regex family. Signal extraction records the matched pattern; when we render the results card we emit:
1. **What we saw** — plain-language finding
2. **Why it matters** — root-cause explanation
3. **What your program does about it** — the specific first-stage direction

Add the 10 explanation rules from the spec (heel rise, valgus, spine rounding, lateral trunk shift, forward trunk lean, lumbar arch overhead, lumbar arch bridge, shoulder shrug, hip hike, pelvis rotation bridge, elbow shoulder-cheat). Elbow shoulder-cheat sets `t.valid = false` in `screen.run.tsx` and shows a "retry" prompt instead of scoring.

Results screen (`src/routes/app/screen.tsx`) gets a new "Findings" section — one card per signal with the three fields above, before the routine.

## PART 3 — Re-scan trigger engine (new `src/lib/corrective/rescan.ts`)

Pure function `evaluateRescan(profile, sessions, program)` returns `{ suggest: boolean, reason: string, message: string, urgency }`. Rules:

1. Foundation-phase sessions completed → "Ready to re-scan and move to Build"
2. User answers "something changed" on post-session prompt → "Sounds like something shifted"
3. Two consecutive 14-day scans with no improvement → "Consider a movement specialist" (different copy)
4. Goal changed since last scan → immediate re-scan CTA
5. Test now passes cleanly → celebration, remove from primary focus, progress area
6. Passes primary angle but compensation still present → NOT clean, stays Foundation, explicit copy

Wire into `src/routes/app/index.tsx` (home banner) and `src/routes/app/program.tsx` (top card). Post-session feedback question added to program screen.

## PART 4 — No-correction-needed program paths (`src/lib/corrective/decision.ts` + `engine.ts`)

New `buildProgramPlan(session)` produces one of:
- **Clean pass on an area** → maintenance slot for that area, primary focus shifts to remaining issues
- **All clean** → skip Foundation, jump straight to Stage 3 Maintain & Perform based on `goal`
- **Only borderline (score 2, no compensation)** → light Foundation (1–2 exercises) for those areas, primary focus goes to Build for the rest

`engine.ts` accepts an area-level `mode: "foundation" | "build" | "maintain"` override per area so mixed plans work in one routine.

## PART 5 — Non-goals / preserved invariants

- No LLM calls anywhere in this pipeline — all deterministic.
- Low-back push-up blocklist, curated library only, 2-focus cap, 14-day timer, phase ratios — all unchanged.
- No DB schema changes required; new fields ride inside the existing `ScreenSession` JSON blob in `profiles.app_user`.

## Technical checkpoints

- Type additions in `src/lib/store.ts` for `viewFindings` and `postSessionFeedback`.
- `screen.run.tsx` refactor is the biggest chunk — view queue, transition screen, per-view detector dispatch.
- Verify with `bunx tsgo --noEmit` after each of Part 1, Part 2+4, Part 3.

Scope is large — I'll implement in that order and verify the build between parts. Approve to proceed.
