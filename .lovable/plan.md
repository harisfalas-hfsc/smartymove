## Scope
Mobile view only for `/app/profile` (`src/routes/app/profile.tsx`). Desktop layout is unaffected.

## 1. Clean up the avatar menu (mobile)

Current rows: Goal, Joint focus, Notifications, Account settings, Desktop view, Your data, Sign out (at the very bottom, below Delete account).

Change to:
- **Remove** the "Notifications" row.
- **Remove** the "Desktop view" row.
- **Collapse** "Goal" + "Joint focus" into a single row called **"Assessment & goals"** (icon: `ClipboardList`). Tapping it opens the full onboarding flow from step 1, in edit mode:
  1. Release of liability / PAR-Q health & safety check (`/onboarding/parq`)
  2. Quick readiness questionnaire (`/onboarding/questionnaire`)
  3. Joint focus (`/onboarding/joints`)
  4. Disclaimer / consent (`/onboarding/disclaimer`)
  5. Goal (`/onboarding/goal`)
  All steps are pre-filled with the user's saved answers so they only re-confirm or change what they want; Save updates the same fields already stored.
- **Keep** "Account settings" (name / age editor) and "Your data" (export + delete) as they are.
- **Move Sign out** into the avatar menu itself — render it as the last row inside the menu list, styled as a normal (non-destructive) row with the `LogOut` icon. Remove the separate Sign out button that currently sits under "Delete account".
- Delete-account stays where it is inside the "Your data" card.

## 2. Route the onboarding entry point into "edit" mode

Today `/onboarding/*` is a linear flow gated by `getFirstIncompleteOnboardingPath`. When entered from the profile, it must:
- Always start at `/onboarding/parq` regardless of completion state.
- Skip the auto-redirect in `src/routes/app/route.tsx` that pushes users to the first incomplete step (only skip when we came from the profile edit entry — use a query flag like `?edit=1` on the onboarding routes, or set a dedicated "edit mode" flag via `setOnboardingNextPath("/app/profile")` plus a new `edit` search param).
- After the final step (Goal), return the user to `/app/profile` instead of `/app/screen/run`.

Minimum change: add `?edit=1` to every `<Link>`/`navigate` from the new "Assessment & goals" row, read it in `src/routes/onboarding/route.tsx` + each step's Continue handler, and in edit mode navigate forward through the same 5 steps then back to `/app/profile`. No new fields, no schema change — just re-use the existing forms so the user can update `parq`, `questionnaire`, `joints`, `disclaimer` acknowledgement, and `goal`.

## 3. Make sure onboarding data actually feeds the scan engine

Audit result of `src/lib/corrective/engine.ts`, `decision.ts`, `phase.ts`, `rescan.ts`, and `src/routes/app/screen.run.tsx`:

Already consumed by the engine:
- `user.goal` — drives default focus areas, ongoing track, and rescan trigger on change.
- `user.questionnaire.joints` — drives focus areas, decision clustering, pain/goal area boosting.
- `user.age` — passed to `computeSession`.
- Pain flags from the per-test pain prompts — cap sub-scores, score 0.

Not currently consumed:
- `user.parq` answers (only used as a safety gate before the scan).
- `user.questionnaire` non-joint fields (readiness — activity level, prior injuries, symptoms) if any exist beyond joints.
- `user.disclaimer` acknowledgement (consent only).

Action:
- Extend `computeSession` (called from `screen.run.tsx` line 721) to also pass `parq` and the full `questionnaire` object into the decision engine.
- In `src/lib/corrective/decision.ts`, use those signals to:
  - Add any PAR-Q "yes" flag (bone/joint issue, balance loss, chest pain, etc.) as an additional area/pain boost and cap the corresponding sub-score at 50, matching the existing pain-cap rule.
  - Use the readiness questionnaire's activity-level / recent-injury fields (whichever already exist in `ParqAnswers` / `Questionnaire` types) to bias exercise phase selection in `phase.ts` (e.g. keep a low-activity user in Foundation longer; flag a recent-injury area for extra caution in `libraries.ts` blocklist logic).
- Disclaimer stays a pure consent record — no engine effect, but it must still be acknowledged in edit mode to keep the record fresh.

Exact fields wired in will be confirmed by re-reading `ParqAnswers` and `Questionnaire` types during implementation; only fields that already exist will be used — no new schema.

## Files touched

- `src/routes/app/profile.tsx` — mobile menu restructure, Sign out row inside menu, remove Notifications + Desktop view rows, merge Goal + Joint focus into one entry.
- `src/routes/onboarding/route.tsx` — support `?edit=1` (skip completion gate, return to `/app/profile` at the end).
- `src/routes/onboarding/parq.tsx`, `questionnaire.tsx`, `joints.tsx`, `disclaimer.tsx`, `goal.tsx` — propagate `?edit=1` in the "Continue" navigation; on the last step navigate to `/app/profile` instead of `/app/screen/run` when in edit mode.
- `src/routes/app/route.tsx` — do not force-redirect back into onboarding when the user is intentionally editing.
- `src/lib/corrective/decision.ts`, `src/lib/corrective/engine.ts`, `src/lib/corrective/phase.ts`, `src/routes/app/screen.run.tsx` — feed `parq` + full `questionnaire` into `computeSession` and use them for area boosts / phase pacing.

## Verification
- `bunx tsgo --noEmit` after edits.
- Manual mobile-view walkthrough: tap avatar → see 3 rows (Assessment & goals, Account settings, Your data) + Sign out; tap Assessment & goals → land on PAR-Q with previous answers filled → advance through all 5 steps → return to profile.
- Desktop view unchanged — confirmed by reading `DesktopProfile.tsx` (it is a separate component and is not touched).

## Out of scope
- Desktop profile layout.
- Any change to onboarding question copy or field set.
- Notification system (removed from UI only; no backend change needed since it was static copy).
