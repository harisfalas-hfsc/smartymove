# SmartyMove 7-Pattern Scan (rebrand + fixed set)

Replace the current "Core 5 + conditional add-ons" flow with a fixed set of **7 movement patterns**, branded as **SmartyMove Scan** (no "FMS" wording anywhere user-facing).

## The 7 patterns (ids)

1. `deep_squat` — bilateral, front + side
2. `hurdle_step` — bilateral (L/R), front + side
3. `inline_lunge` — bilateral (L/R), front + side
4. `shoulder_mobility` — bilateral (L/R), front only
5. `active_straight_leg_raise` — bilateral (L/R), side
6. `trunk_stability_pushup` — single, side
7. `rotary_stability` — bilateral (L/R), side (scoring rules TBD by user — placeholder scoring for now)

## Scoring model

- Per rep: **3 / 2 / 1 / 0** (0 = pain, 1 = cannot perform, 2 = performs with compensation, 3 = clean).
- Bilateral tests: record L and R, final score = **lower of the two**.
- Clearing tests → auto-0 on the parent pattern when pain is reported:
  - Shoulder impingement clear → clears `shoulder_mobility`
  - Press-up clear → clears `trunk_stability_pushup`
  - Posterior rocking clear → clears `rotary_stability`
- Total score = sum of the 7 final scores (max 21).
- `rotary_stability`: keep the movement + camera capture, but leave scoring as a simple presence/compensation placeholder until the user gives the exact rules.

## Changes

### 1. `src/lib/movement.ts`
- Remove `CORE_TESTS` + `CONDITIONAL_TESTS`; export a single `SCAN_PATTERNS` array of the 7 ids above with:
  - `name` (SmartyMove-branded, no "FMS")
  - `views` (front/side per pattern)
  - `bilateral` flag
  - `clearingTest` metadata where applicable
- Rewrite `TEST_GUIDES` with our own paraphrased setup/execution/compensation copy per pattern (kept faithful to the standard protocol, worded in SmartyMove voice). Instructions scaffolding (front/face/side headings, "Compensations to watch") stays as it is today.
- Update `TEST_VIEWS` and `REFERENCE_RANGES` to the new 7 ids.

### 2. `src/routes/app/screen.index.tsx`
- Drop "Core 5 + add-ons" copy.
- Show: **"SmartyMove Scan · 7 movement patterns · ~7 minutes"** and list the 7 patterns.

### 3. `src/routes/app/screen.run.tsx`
- Remove the conditional/joint-based add-on branch entirely.
- Iterate the fixed 7 patterns; for bilateral ones, run L then R as two sub-steps.
- Add a "Any pain?" prompt on the 3 clearing-test patterns → forces final score 0 on that pattern.
- Keep the existing confirmation modal before consuming the scan credit.
- Keep the front/side view instructions and compensation watch-list rendering unchanged (only the underlying data changes).

### 4. Program generator (area mapping)
Map low pattern scores → flagged areas the corrective engine already knows:
- `deep_squat` low → Ankle + Hip + Low Back
- `hurdle_step` low → Ankle + Knee + Hip
- `inline_lunge` low → Ankle + Knee + Hip
- `shoulder_mobility` low → Shoulder
- `active_straight_leg_raise` low → Hip + Low Back
- `trunk_stability_pushup` low → Low Back (blocks push-ups per existing rule)
- `rotary_stability` low → Low Back + Hip

Existing "two areas max" and curated-library rules are preserved.

### 5. Branding / copy
- User-facing strings say **"SmartyMove Scan"** / **"movement pattern"** — never "FMS" or "Functional Movement Screen".

## Out of scope (deferred to a later turn)
- Final scoring rules for `rotary_stability` (waiting on the user's instructions).
- Any change to pricing, credits, confirmation modal, or program duration.

## Verification
- `bunx tsgo --noEmit` after implementation.
- Manual click-through of the scan flow to confirm all 7 patterns render with correct views and the clearing-test prompts appear.
