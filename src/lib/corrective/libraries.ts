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
      "Knee To Wall",
      "Ankle Rockers",
      "Calf Stretch",
      "Soleus Stretch",
      "Ankle Circles",
      "Toe Elevation Stretch",
      "Dorsiflexion Mobilization",
      "Heel Raises",
      "Tibialis Raises",
      "Foot Rolling",
    ],
    stability: [
      "Single Leg Balance",
      "Single Leg Balance Eyes Closed",
      "Star Balance Reach",
      "Clock Reach",
      "Single Leg RDL Reach",
      "Tandem Walk",
      "Heel Walk",
      "Toe Walk",
      "Bosu Balance",
      "Lateral Hops",
    ],
    strength: [
      "Calf Raises",
      "Single Leg Calf Raises",
      "Tibialis Raises",
      "Split Squat",
      "Reverse Lunge",
      "Step Ups",
      "Farmer Carry",
      "Walking Lunges",
      "Skater Step",
      "Sled Push",
    ],
  },
  knee: {
    mobility: [
      "Quad Stretch",
      "Hamstring Stretch",
      "Calf Stretch",
      "Knee Flexion Mobilization",
      "Heel Slides",
      "Assisted Deep Squat Hold",
      "Couch Stretch",
      "Adductor Rockback",
      "Hip Flexor Stretch",
      "Ankle Mobility Drill",
    ],
    stability: [
      "Single Leg Balance",
      "Step Down Hold",
      "Split Squat Hold",
      "Wall Sit",
      "Terminal Knee Control",
      "Lateral Reach",
      "Clock Reach",
      "Single Leg Sit To Stand",
      "Balance Pad Hold",
      "March Hold",
    ],
    strength: [
      "Sit To Stand",
      "Goblet Squat",
      "Split Squat",
      "Reverse Lunge",
      "Step Ups",
      "Bulgarian Split Squat",
      "Wall Sit",
      "Spanish Squat",
      "Deadlift",
      "Farmer Carry",
    ],
  },
  hip: {
    mobility: [
      "90/90 Hip Stretch",
      "Hip Rotations",
      "Figure Four Stretch",
      "Adductor Rockback",
      "Frog Stretch",
      "Hip Flexor Stretch",
      "World's Greatest Stretch",
      "Cossack Mobility",
      "Glute Stretch",
      "Leg Swings",
    ],
    stability: [
      "Single Leg Balance",
      "Bird Dog",
      "Dead Bug",
      "Side Plank",
      "Glute Bridge Hold",
      "Hip Airplane",
      "March Hold",
      "Single Leg Reach",
      "Pallof Press",
      "Split Stance Hold",
    ],
    strength: [
      "Glute Bridge",
      "Hip Thrust",
      "Split Squat",
      "Step Up",
      "Deadlift",
      "Single Leg RDL",
      "Goblet Squat",
      "Farmer Carry",
      "Lateral Lunge",
      "Walking Lunge",
    ],
  },
  low_back: {
    mobility: [
      "Cat Cow",
      "Child Pose",
      "Open Book",
      "Pelvic Tilt",
      "Hip Flexor Stretch",
      "90/90 Hip Stretch",
      "Hamstring Mobility",
      "Thoracic Rotation",
      "Adductor Rockback",
      "Deep Squat Hold",
    ],
    stability: [
      "Bird Dog",
      "Dead Bug",
      "Side Plank",
      "Front Plank",
      "Pallof Press",
      "Glute Bridge Hold",
      "March Hold",
      "Bear Hold",
      "Suitcase Carry",
      "Single Leg Balance",
    ],
    strength: [
      "Glute Bridge",
      "Hip Thrust",
      "Farmer Carry",
      "Suitcase Carry",
      "Step Up",
      "Split Squat",
      "Goblet Squat",
      "Deadlift Progressions",
      "Reverse Lunge",
      "Sled Push",
    ],
  },
  shoulder: {
    mobility: [
      "Wall Slides",
      "Thread The Needle",
      "Open Book",
      "Arm Circles",
      "Band Dislocates",
      "Thoracic Rotation",
      "Child Pose Reach",
      "Pec Stretch",
      "Lat Stretch",
      "Sleeper Stretch",
    ],
    stability: [
      "Scapular Push Up",
      "Y Hold",
      "T Hold",
      "Wall Slide Hold",
      "Bottom Up Carry",
      "Farmer Carry",
      "Dead Bug Reach",
      "Bird Dog Reach",
      "Side Plank Reach",
      "Band External Rotation",
    ],
    strength: [
      "Row",
      "Face Pull",
      "Band Pull Apart",
      "Landmine Press",
      "Half Kneeling Press",
      "Carry Variations",
      "TRX Row",
      "Incline Push Up",
      "Dumbbell Press",
      "Shoulder Press",
    ],
  },
  elbow: {
    mobility: [
      "Wrist Flexor Stretch",
      "Wrist Extensor Stretch",
      "Forearm Rotations",
      "Elbow Flexion Extension",
      "Nerve Glides",
      "Wall Mobility",
      "Hand Open Close",
      "Grip Mobility",
      "Finger Extensions",
      "Wrist Circles",
    ],
    stability: [
      "Grip Hold",
      "Farmer Carry",
      "Bottom Up Carry",
      "Dead Hang",
      "Suitcase Carry",
      "Band Holds",
      "Wrist Isometrics",
      "Towel Grip",
      "Plank Hold",
      "Push Up Hold",
    ],
    strength: [
      "Row",
      "Hammer Curl",
      "Reverse Curl",
      "Farmer Carry",
      "Wrist Curl",
      "Wrist Extension",
      "Grip Crush",
      "TRX Row",
      "Band Row",
      "Carry Variations",
    ],
  },
  wrist: {
    mobility: [
      "Wrist Circles",
      "Palm Stretch",
      "Reverse Palm Stretch",
      "Wrist Flexion Stretch",
      "Wrist Extension Stretch",
      "Finger Mobility",
      "Prayer Stretch",
      "Table Wrist Rocks",
      "Forearm Rotation",
      "Hand Open Close",
    ],
    stability: [
      "Quadruped Weight Shift",
      "Wrist Isometric Hold",
      "Farmer Carry",
      "Bottom Up Carry",
      "Wall Push Hold",
      "Bear Hold",
      "Plank Hold",
      "Side Plank Hold",
      "Grip Hold",
      "Towel Hold",
    ],
    strength: [
      "Wrist Curl",
      "Reverse Wrist Curl",
      "Farmer Carry",
      "Grip Crush",
      "Plate Pinch",
      "Band Extension",
      "Rice Bucket Work",
      "Hammer Rotation",
      "Dead Hang",
      "Carry Variations",
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