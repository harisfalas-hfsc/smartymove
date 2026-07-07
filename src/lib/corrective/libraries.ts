/**
 * SmartyMove Corrective Exercise Libraries.
 *
 * Curated per-area, per-category lists from the v1 spec. The routine
 * engine NEVER invents exercises — it can only pick from these names
 * and resolve each one to the closest row in the `public.exercises`
 * library table.
 */

export type Area = "ankle" | "knee" | "hip" | "low_back" | "shoulder" | "elbow" | "wrist";
export type Category = "mobility" | "stability" | "strength";

export const AREA_LABEL: Record<Area, string> = {
  ankle: "Ankle",
  knee: "Knee",
  hip: "Hip",
  low_back: "Low Back",
  shoulder: "Shoulder",
  elbow: "Elbow",
  wrist: "Wrist",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  mobility: "Mobility",
  stability: "Stability",
  strength: "Strength",
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  mobility: "🧘",
  stability: "🪨",
  strength: "🏋️",
};

/** Default duration per category (seconds). */
export const CATEGORY_DURATION: Record<Category, number> = {
  mobility: 60,
  stability: 45,
  strength: 45,
};

/** Exercises explicitly forbidden for a given area (clinical safety). */
export const AREA_BLOCKLIST: Record<Area, string[]> = {
  ankle: [],
  knee: [],
  hip: [],
  low_back: ["push up", "push-up", "pushup"],
  shoulder: [],
  elbow: [],
  wrist: [],
};

export type LibraryMap = Record<Area, Record<Category, string[]>>;

export const LIBRARY: LibraryMap = {
  ankle: {
    mobility: [
      "Knee-to-Wall Dorsiflexion",
      "Half-Kneeling Ankle Rocker",
      "Standing Calf Stretch (gastroc)",
      "Bent-Knee Calf Stretch (soleus)",
      "Seated Ankle Circles",
      "Toes-Elevated Calf Stretch",
      "Banded Ankle Distraction",
      "Downward Dog Pedal",
      "Deep Squat Ankle Rocker",
      "Prone Tibialis Stretch",
      "Foot Doming / Short Foot",
      "Toe Spreads & Flexion Drill",
    ],
    stability: [
      "Single-Leg Balance",
      "Single-Leg Balance \u2013 Eyes Closed",
      "Star / Y-Balance Reach",
      "Clock Reach",
      "Single-Leg RDL Reach (bodyweight)",
      "Tandem Walk (heel-to-toe)",
      "Heel Walks",
      "Toe Walks",
      "Foam Pad Single-Leg Hold",
      "Lateral Line Hops (low)",
      "Ankle Alphabet",
      "Single-Leg Ball Toss",
    ],
    strength: [
      "Double-Leg Calf Raises",
      "Single-Leg Calf Raises",
      "Seated Calf Raises (soleus focus)",
      "Tibialis Raises (wall)",
      "Banded Ankle Dorsiflexion",
      "Banded Ankle Eversion",
      "Banded Ankle Inversion",
      "Split Squat",
      "Reverse Lunge",
      "Step-Up (low box)",
      "Farmer Carry",
      "Walking Lunge",
    ],
  },
  knee: {
    mobility: [
      "Standing Quad Stretch",
      "Couch Stretch",
      "Supine Hamstring Stretch (strap)",
      "Standing Calf Stretch",
      "Heel Slides",
      "Assisted Deep Squat Hold",
      "Adductor Rockback",
      "Kneeling Hip Flexor Stretch",
      "Seated Knee Extension Hold",
      "Prone Knee Bend",
      "Foam Roll Quads",
      "Foam Roll IT Band / TFL",
    ],
    stability: [
      "Single-Leg Balance",
      "Step-Down Hold",
      "Split Squat Isometric Hold",
      "Wall Sit",
      "Terminal Knee Extension (band)",
      "Lateral Step-Down",
      "Clock Reach",
      "Single-Leg Sit-to-Stand",
      "Balance Pad Mini-Squat",
      "March Hold (knee lift)",
      "Copenhagen Adductor Hold (short lever)",
      "Poliquin Step-Up",
    ],
    strength: [
      "Sit-to-Stand",
      "Goblet Squat",
      "Bulgarian Split Squat",
      "Reverse Lunge",
      "Step-Up",
      "Spanish Squat (band)",
      "Wall Sit (loaded)",
      "Nordic Hamstring Curl (assisted)",
      "Romanian Deadlift (dumbbell)",
      "Cyclist Squat (heels elevated)",
      "Slow Tempo Squat (3-1-3)",
      "Farmer Carry",
    ],
  },
  hip: {
    mobility: [
      "90/90 Hip Stretch",
      "Seated Figure-Four Stretch",
      "Frog Stretch",
      "World's Greatest Stretch",
      "Cossack Squat Mobility",
      "Half-Kneeling Hip Flexor Stretch",
      "Pigeon Stretch",
      "Standing Leg Swings (front/back)",
      "Standing Leg Swings (side)",
      "Hip CARs (Controlled Articular Rotations)",
      "Deep Squat Hold with Pry",
      "Supine Figure-Four Stretch",
    ],
    stability: [
      "Single-Leg Balance",
      "Bird Dog",
      "Dead Bug",
      "Side Plank (from knees)",
      "Side Plank (full)",
      "Glute Bridge Hold",
      "Single-Leg Glute Bridge",
      "Hip Airplane",
      "Standing March Hold",
      "Pallof Press (band)",
      "Clamshell",
      "Banded Lateral Walk",
    ],
    strength: [
      "Glute Bridge",
      "Hip Thrust (dumbbell)",
      "Split Squat",
      "Step-Up",
      "Romanian Deadlift (dumbbell)",
      "Single-Leg RDL",
      "Goblet Squat",
      "Lateral Lunge",
      "Walking Lunge",
      "Kettlebell Deadlift",
      "Curtsy Lunge",
      "Farmer Carry",
    ],
  },
  low_back: {
    mobility: [
      "Cat-Cow",
      "Child's Pose",
      "Open Book (side-lying)",
      "Supine Pelvic Tilts",
      "Half-Kneeling Hip Flexor Stretch",
      "Seated 90/90 Hip Stretch",
      "Supine Hamstring Stretch (strap)",
      "Thoracic Rotation (quadruped)",
      "Adductor Rockback",
      "Deep Squat Hold (supported)",
      "Prayer Stretch (thoracic)",
      "Foam Roll Thoracic Extension",
    ],
    stability: [
      "Bird Dog",
      "Dead Bug",
      "Side Plank (from knees)",
      "Front Plank",
      "Pallof Press (band)",
      "Glute Bridge Hold",
      "March Hold (supine)",
      "Bear Hold",
      "Suitcase Carry",
      "Single-Leg Balance",
      "McGill Curl-Up",
      "Standing Anti-Rotation Hold",
    ],
    strength: [
      "Glute Bridge",
      "Hip Thrust (dumbbell)",
      "Farmer Carry",
      "Suitcase Carry",
      "Step-Up",
      "Split Squat",
      "Goblet Squat",
      "Hip Hinge Practice (dowel)",
      "Kettlebell Deadlift",
      "Reverse Lunge",
      "Bird Dog Row (light DB)",
      "Sled Push (light)",
    ],
  },
  shoulder: {
    mobility: [
      "Wall Slides",
      "Thread the Needle",
      "Open Book",
      "Arm Circles",
      "Band Pass-Throughs / Dislocates",
      "Pec Doorway Stretch",
      "Lat Stretch (kneeling)",
      "Sleeper Stretch",
      "Cross-Body Shoulder Stretch",
      "Child's Pose Reach",
      "Prone Y/T/W",
      "Shoulder CARs",
    ],
    stability: [
      "Scapular Push-Up (from knees)",
      "Y Hold (prone)",
      "T Hold (prone)",
      "Wall Slide Hold",
      "Bottom-Up Kettlebell Carry",
      "Farmer Carry",
      "Dead Bug with Reach",
      "Bird Dog with Reach",
      "Side Plank with Reach",
      "Band External Rotation (0\u00b0)",
      "Band External Rotation (90\u00b0)",
      "Prone I-Y-T-W Series",
    ],
    strength: [
      "Seated Dumbbell Row",
      "Face Pull (band)",
      "Band Pull-Apart",
      "Landmine Press",
      "Half-Kneeling Overhead Press (DB)",
      "Farmer Carry",
      "TRX / Suspension Row",
      "Incline Push-Up (elevated)",
      "Standing Dumbbell Press",
      "Half-Kneeling Single-Arm Press",
      "Single-Arm Dumbbell Row",
      "Prone Dumbbell Row",
    ],
  },
  elbow: {
    mobility: [
      "Wrist Flexor Stretch",
      "Wrist Extensor Stretch",
      "Forearm Pronation/Supination",
      "Elbow Flexion-Extension AROM",
      "Median Nerve Glide",
      "Radial Nerve Glide",
      "Ulnar Nerve Glide",
      "Prayer Stretch",
      "Reverse Prayer Stretch",
      "Elbow Circles",
      "Doorway Biceps Stretch",
      "Foam Roll Forearm",
    ],
    stability: [
      "Grip Hold (timed)",
      "Farmer Carry",
      "Bottom-Up Kettlebell Carry",
      "Dead Hang (assisted)",
      "Suitcase Carry",
      "Isometric Wrist Extension Hold",
      "Isometric Wrist Flexion Hold",
      "Towel Grip Hold",
      "Front Plank on Fists",
      "Quadruped Weight Shift",
      "Band Pronation Hold",
      "Band Supination Hold",
    ],
    strength: [
      "Seated Dumbbell Row",
      "Hammer Curl",
      "Reverse Curl",
      "Wrist Curl",
      "Wrist Extension (dumbbell)",
      "Farmer Carry",
      "Eccentric Wrist Extension (Tyler twist alt.)",
      "Eccentric Wrist Flexion",
      "TRX / Suspension Row",
      "Band Row",
      "Chin-Up (assisted)",
      "Zottman Curl",
    ],
  },
  wrist: {
    mobility: [
      "Wrist Circles",
      "Palm Stretch (fingers up)",
      "Reverse Palm Stretch (fingers down)",
      "Prayer Stretch",
      "Reverse Prayer Stretch",
      "Finger Extensions (band)",
      "Table Wrist Rocks",
      "Forearm Pronation/Supination",
      "Hand Open-Close",
      "Thumb Circles",
      "Median Nerve Glide",
      "Foam Roll Forearm",
    ],
    stability: [
      "Quadruped Weight Shift",
      "Wrist Isometric Hold (flexion)",
      "Wrist Isometric Hold (extension)",
      "Front Plank on Fists",
      "Bear Hold",
      "Farmer Carry",
      "Bottom-Up Carry",
      "Wall Push Hold",
      "Towel Grip Hold",
      "Side Plank on Elbow",
      "Fingertip Push Hold (wall)",
      "Ball Squeeze Hold",
    ],
    strength: [
      "Wrist Curl",
      "Reverse Wrist Curl",
      "Farmer Carry",
      "Plate Pinch",
      "Band Finger Extension",
      "Rice Bucket Work",
      "Hammer Rotation (pronation/supination)",
      "Dead Hang (assisted)",
      "Zottman Curl",
      "Towel Pull-Up (assisted)",
      "Wrist Roller",
      "Kettlebell Bottoms-Up Press (light)",
    ],
  },
};

/** Map app's Joint enum to corrective Area. */
export function jointToArea(joint: string): Area | null {
  switch (joint) {
    case "ankle": return "ankle";
    case "knee": return "knee";
    case "hip": return "hip";
    case "back": return "low_back";
    case "shoulder": return "shoulder";
    case "elbow": return "elbow";
    case "wrist": return "wrist";
    default: return null;
  }
}

/** Default areas to focus on when the user reports no specific pain area. */
export const GOAL_DEFAULT_AREAS: Record<string, Area[]> = {
  reduce_pain: ["low_back", "hip"],
  prevent_injury: ["knee", "shoulder"],
  start_sport: ["ankle", "hip"],
  perform_better: ["hip", "shoulder"],
  feel_better: ["low_back", "hip"],
};