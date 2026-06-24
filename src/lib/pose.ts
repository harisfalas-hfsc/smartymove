import type { PoseLandmarker as PLT } from "@mediapipe/tasks-vision";

type ModelTier = "full" | "lite";

const MODEL_URLS: Record<ModelTier, string> = {
  full: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task",
  lite: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
};

let landmarker: PLT | null = null;
let currentTier: ModelTier | null = null;
let loading: Promise<PLT> | null = null;
let visionMod: typeof import("@mediapipe/tasks-vision") | null = null;
let fileset: Awaited<ReturnType<typeof import("@mediapipe/tasks-vision").FilesetResolver.forVisionTasks>> | null = null;

async function createLandmarker(tier: ModelTier): Promise<PLT> {
  if (!visionMod) visionMod = await import("@mediapipe/tasks-vision");
  if (!fileset) {
    fileset = await visionMod.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm",
    );
  }
  return visionMod.PoseLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URLS[tier], delegate: "GPU" },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

/**
 * Load the best-available pose model. Defaults to the "full" variant for
 * accuracy; callers can downgrade to "lite" at runtime if the device shows a
 * sustained frame-rate drop (see `maybeFallbackToLite`).
 */
export async function getPoseLandmarker(): Promise<PLT> {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    try {
      const lm = await createLandmarker("full");
      landmarker = lm;
      currentTier = "full";
      return lm;
    } catch {
      const lm = await createLandmarker("lite");
      landmarker = lm;
      currentTier = "lite";
      return lm;
    }
  })();
  return loading;
}

export function getCurrentModelTier(): ModelTier | null {
  return currentTier;
}

/**
 * If the running model is "full" and per-frame detection latency exceeds the
 * given threshold (default ~50 ms ≈ <20 FPS), swap in the lighter model so the
 * scan stays responsive on lower-end devices. Returns the tier in use after the
 * check. No-op if already on "lite".
 */
export async function maybeFallbackToLite(avgFrameMs: number, thresholdMs = 50): Promise<ModelTier> {
  if (currentTier !== "full" || avgFrameMs <= thresholdMs) return currentTier ?? "lite";
  try {
    const prev = landmarker;
    const lite = await createLandmarker("lite");
    landmarker = lite;
    currentTier = "lite";
    prev?.close?.();
    return "lite";
  } catch {
    return "full";
  }
}

export const PL = {
  NOSE: 0,
  LEFT_EAR: 7, RIGHT_EAR: 8,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
  LEFT_WRIST: 15, RIGHT_WRIST: 16,
  LEFT_HIP: 23, RIGHT_HIP: 24,
  LEFT_KNEE: 25, RIGHT_KNEE: 26,
  LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};
