import type { Goal, Joint } from "./store";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  durationSec: number;
  targets: { restriction?: string[]; goals?: Goal[]; joints?: Joint[] };
  emoji: string;
}

export const EXERCISES: Exercise[] = [
  { id: "ankle_rocker", name: "Ankle Rocker", description: "Half-kneel, drive front knee over toes. Pulse 10×.", durationSec: 45, targets: { restriction: ["mobility"], joints: ["ankle","knee"], goals: ["prevent_injury","start_sport"] }, emoji: "🦵" },
  { id: "hip_90_90", name: "90/90 Hip Switches", description: "Sit tall, rotate hips side-to-side, slow and controlled.", durationSec: 60, targets: { restriction: ["mobility"], joints: ["hip","back"], goals: ["feel_better","reduce_pain"] }, emoji: "🦴" },
  { id: "glute_bridge", name: "Glute Bridge Hold", description: "Lie on back, drive hips up, squeeze glutes for the hold.", durationSec: 45, targets: { restriction: ["strength","stability"], joints: ["back","hip"], goals: ["reduce_pain","prevent_injury"] }, emoji: "🌉" },
  { id: "wall_slide", name: "Wall Slide", description: "Back to wall, slide forearms up and down keeping contact.", durationSec: 60, targets: { restriction: ["mobility","quality"], joints: ["shoulder"], goals: ["feel_better","perform_better"] }, emoji: "🧱" },
  { id: "single_leg_rdl", name: "Single-leg RDL (tempo)", description: "Hinge at hip on one leg, reach down with control.", durationSec: 60, targets: { restriction: ["balance","stability"], joints: ["hip","knee"], goals: ["perform_better","start_sport"] }, emoji: "⚖️" },
  { id: "cat_cow", name: "Cat-Cow Flow", description: "On hands and knees, alternate arching and rounding spine.", durationSec: 45, targets: { restriction: ["mobility","quality"], joints: ["back"], goals: ["reduce_pain","feel_better"] }, emoji: "🐈" },
  { id: "thoracic_open", name: "Thoracic Opener", description: "Side-lying, top arm sweeps open. 8 per side.", durationSec: 60, targets: { restriction: ["mobility"], joints: ["back","shoulder"], goals: ["perform_better","feel_better"] }, emoji: "🌀" },
  { id: "split_squat", name: "Split Squat", description: "Back foot elevated. 8 controlled reps per side.", durationSec: 60, targets: { restriction: ["strength","stability"], joints: ["knee","hip"], goals: ["perform_better","start_sport"] }, emoji: "🏋️" },
];

export function pickRoutine(goal: Goal | undefined, joints: Joint[]): Exercise[] {
  const scored = EXERCISES.map(e => {
    let s = 0;
    if (goal && e.targets.goals?.includes(goal)) s += 2;
    for (const j of joints) if (j !== "none" && e.targets.joints?.includes(j)) s += 3;
    return { e, s };
  });
  scored.sort((a,b) => b.s - a.s);
  return scored.slice(0, 5).map(x => x.e);
}
