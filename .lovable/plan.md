
## Goal

When a SmartyMove user is either (a) performance-minded from the start or (b) shown to be "clear" by their scan(s), we stop pretending they need corrective work forever and hand them off to smartygym.com with a specific category recommendation. SmartyMove stays a scanning + corrective app; SmartyGym is where actual performance training lives.

## What SmartyGym actually offers (verified in that project)

**Single-session Workouts (`/workout/:type`):**
WOD · Strength · Calorie Burning · Metabolic · Cardio · Mobility · Challenge · Pilates · Recovery · Micro-workouts

**Multi-week Training Programs (`/training-program/:type`):**
Cardio Endurance · Functional Strength · Muscle Hypertrophy · Weight Loss · Pain Relief · Movement Quality

We link into these directly — no auth handoff needed, they're public browse pages.

## Graduation criteria (when to cross-sell)

A user is "cleared for performance" when ANY of:
1. Latest scan `overall` ≥ 85 AND no test scored 1/3 AND no active pain flag in questionnaire.
2. Two consecutive scans where the newest has `overall` ≥ 80 and no 1/3 tests (they proved improvement).
3. First scan is fully green (no failure clusters detected by `analyzeScan`) — even a new user can qualify.

A user is "performance-minded up front" when questionnaire goal ∈ {`perform_better`, `start_sport`} AND PAR-Q is clean (no medical flags). They see performance CTAs from day one, alongside their program — not instead of it.

## Goal → SmartyGym recommendation map

| SmartyMove goal | Primary program | Backup workouts |
|---|---|---|
| perform_better | Functional Strength (program) | Strength, Metabolic, Challenge |
| start_sport | Cardio Endurance (program) | Cardio, Mobility, Metabolic |
| feel_better | Movement Quality (program) | Pilates, Mobility, Recovery |
| prevent_injury | Movement Quality (program) | Mobility, Recovery, Pilates |
| reduce_pain | Pain Relief (program) — **only after cleared** | Recovery, Mobility |

Reduce-pain users never see performance cross-sells until they graduate. Everyone else sees at least the "Recovery/Mobility" tier from the start.

## Where the CTAs appear

1. **Progress screen (`src/routes/app/progress.tsx`)** — new "Ready for performance" card at the top when graduated, or a softer "Continue building at SmartyGym" card when performance-minded but still mid-program. Card shows 1 recommended program + 2 recommended workout categories, each linking to the matching smartygym.com URL in a new tab.

2. **Program screen (`src/routes/app/program.tsx`)** — after the user marks the 14th day complete (program finished), show a "What's next" panel with the same recommendations plus a "Retest first" secondary button.

3. **Home (`src/routes/app/index.tsx`)** — subtle banner ("Cleared. Level up →") only when graduated, dismissible.

Copy is honest: "Your scan says your movement is ready — SmartyMove is a scanner, not a gym. Train performance at SmartyGym." No fake urgency.

## Technical plan

**New file `src/lib/graduation.ts`** — pure logic:
- `evaluateGraduation(user): { status: 'not-cleared' | 'performance-track' | 'cleared'; reason: string }`
- `recommendSmartyGym(user, status): { program: {slug,title,url}; workouts: [{slug,title,url}] }`
- URL builder pointing at `https://smartygym.com/training-program/{slug}` and `https://smartygym.com/workout/{slug}`.

**New component `src/components/SmartyGymHandoff.tsx`** — the visual card used by all three surfaces. Props: `variant: 'cleared' | 'performance-track' | 'program-complete'`, plus the recommendation object.

**Edits:**
- `src/routes/app/progress.tsx` — mount the card above existing content when applicable.
- `src/routes/app/program.tsx` — show the "What's next" panel on completion.
- `src/routes/app/index.tsx` — cleared-only banner.

**No backend / DB changes.** Everything is derived client-side from the existing `user.sessions`, `user.goal`, and questionnaire state. No new tables, no migrations.

**Verification:** typecheck + Playwright pass on the progress route in both states (mock a cleared scan, mock a mid-program state) to confirm the correct card variant renders and the outbound links resolve.

## Out of scope (say so explicitly)

- Deep linking a specific SmartyGym workout ID — we route to the category page and let SmartyGym own selection.
- Shared login / SSO between the two apps — not part of this change.
- Adding SmartyGym content inside SmartyMove — this is a handoff, not an embed.
