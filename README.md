# SMARTY MOVE 

SMARTYMOVE.  Build a mobile-first web app called "SmartyMove." It must look and feel like a native mobile app (bottom tab navigation, rounded cards, no visible browser chrome, smooth transitions). Use a calm, professional, clinical-but-friendly visual style — physiotherapy meets modern wellness app. Teal-to-blue gradient as the primary brand color, soft whitespace, rounded corners, clear large typography. Tagline: "Know how you move. Move smarter." THE MAIN WORKING VIEW SHOULD BE THE MOBILE VIEW. THE DESKTOP VIEW SHOULD ONLY BE A SIMPLE PAGE THAT SOMEONE CAN VIEW HIS PROFILE, EDIT PROFILE, MANAGE HIS ACCOUND AND GENERALLY VIEW HIS DATA. 

CORE USER FLOW:

1. WELCOME / PROFILE CREATION

- Sign-up: name, age, email/password (use Supabase for auth and data storage)

2. READINESS QUESTIONNAIRE + JOINT ISSUE SELECTION

- General questions: current pain (none/mild/moderate/severe), ability to walk/run/jump/land without pain, recent injury or surgery, any numbness/night pain/unexplained symptoms

- Multi-select (max 2): "Where do you currently have an issue, if any?" — Ankle / Knee / Hip / Low back or spine / Shoulder / Elbow / Wrist / None

- If a red-flag answer is given, show a warning banner ("Please consult a doctor before continuing") but DO NOT block the user from continuing

- Disclaimer screen with required checkbox: "SmartyMove does not provide medical advice. By continuing, you accept our Terms of Use and Liability Waiver." (placeholder legal text, marked "REPLACE WITH LAWYER-REVIEWED TEXT")

3. GOAL SELECTION

- Single-select cards: "Reduce pain," "Prevent injury," "Start a sport or running," "Perform better," "Move and feel better generally"

4. MOVEMENT SCREEN (CAMERA-BASED, CORE + CONDITIONAL)

- Use Google's MediaPipe Pose Landmarker for Web (free, open-source, on-device, runs in-browser, no external API calls, no per-scan cost)

- Before each test, show a full-body silhouette guide overlay so the user positions correctly (roughly 6-8 feet from camera)

CORE TESTS (always run, in this order):

  a. Squat — hip/knee/ankle landmarks; squat depth and left/right knee symmetry

  b. Hip hinge — torso angle and spine curvature via shoulder/hip/knee landmarks

  c. Single-leg balance — hip drop and wobble over a 10-second hold, both sides

  d. Lunge/split-stance reach — front knee tracking and hip/ankle angles, both sides

  e. Overhead reach with rotation — shoulder and torso rotation range, both sides

CONDITIONAL ADD-ON TESTS (run only if that area was selected in step 2, max 2 add-ons):

  - Ankle selected → Ankle dorsiflexion lunge (knee-to-wall style): measure ankle angle and left/right symmetry

  - Knee selected → Single-leg squat / step-down: measure knee tracking/valgus under load

  - Hip selected → Standing hip abduction / lateral stability check: measure frontal-plane hip control

  - Low back/spine selected → Glute bridge endurance hold: measure hold time and hip position stability

  - Shoulder selected → Scapular wall slide / shoulder flexion control: measure shoulder blade and arm control

  - Elbow selected → Arm flexion-extension range and control check: measure elbow angle via shoulder-elbow-wrist landmarks

  - Wrist selected → Basic guided wrist range check: simplified scoring (lean on self-reported severity here, and note in the UI that this test is less precise than the others)

- For each test, calculate joint angles from pose landmarks, compare left vs right where relevant, score each 1-3 (1 = significant restriction, 2 = moderate, 3 = good)

- Store raw landmark data, computed scores, and which conditional tests were run, per user, with timestamp

5. MOVEMENT SCORE & MOVEMENT AGE

- Calculate 5 sub-scores (0-100 each): Mobility, Stability, Balance, Movement Quality, Strength Capacity, derived from core + any conditional test results

- Calculate overall Movement Score (0-100) as weighted average

- Display all 5 sub-scores as progress bars plus the overall score prominently

- Calculate and display "Movement Age": map overall score to an age-equivalent relative to chronological age. Show "Chronological Age: X — Movement Age: Y" with disclaimer: "Movement Age is a motivational estimate, not a medical or clinical measurement."

6. RESULTS / MOVEMENT PROFILE

- Combine goal + questionnaire + selected joint issues + test scores into a results screen with plain-language flags referencing both core and conditional findings

7. CORRECTIVE PROGRAM

- Assign a daily 5-8 minute micro-routine: 3-5 exercises from a content library (table: exercise name, description, instructional GIF/image placeholder, target restriction tags, target goal tags, target joint-issue tags)

- Guided session screen: exercise name, instructions, countdown timer, "next" button

8. PROGRESS, RE-TEST & PROJECTION

- Dashboard: streak counter, Movement Score history line chart, days until next re-test

- Every 14 days: prompt the user to redo the Core 5 (+ their active conditional tests); show score change as a milestone screen

- Log "first re-test completed" as a distinct, trackable analytics event

- Only after the first re-test, unlock "Future Projection": a soft trend-based estimate framed as a population trend, not a personal guarantee

- Auto-generate a shareable before/after progress card

9. PAYWALL / TIERS

- Free: core Movement Screen only, initial Movement Score, basic report

- Premium (~€4.99/mo): daily micro-workouts, progress tracking, re-tests, goal tracks, Movement Age, full score breakdown, Future Projection, conditional joint-specific tests

- Clear upgrade prompts on locked features rather than hiding them entirely

10. PROFILE / SETTINGS

- Edit goal, edit joint issue selections, notification preferences, subscription management, account settings

DATA: Use Supabase for accounts, questionnaire/joint-issue responses, test scores/history, exercise content library, and subscription status. Keep the schema simple.

DESIGN PRIORITY: The camera/movement screen and the re-test/progress screens should be the most polished — they're the core differentiator and main retention driver. Do not build Premium Plus sport-specific packs yet — that's a future phase.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://smarty-motion-pro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6d78a54d-3c8f-41af-8a37-e779415ace84).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
