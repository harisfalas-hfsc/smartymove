import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isAdminEmail } from "./admin";

export type Joint = "ankle" | "knee" | "hip" | "back" | "shoulder" | "elbow" | "wrist" | "none";
export type Pain = "none" | "mild" | "moderate" | "severe";
export type Goal = "reduce_pain" | "prevent_injury" | "start_sport" | "perform_better" | "feel_better";

export interface ParqAnswers {
  heartCondition: boolean;
  chestPainActivity: boolean;
  chestPainRest: boolean;
  balanceLoss: boolean;
  boneJoint: boolean;
  bpMedication: boolean;
  otherReason: boolean;
  acknowledgedWarning: boolean;
}

export interface Questionnaire {
  pain: Pain;
  canWalk: boolean;
  canRun: boolean;
  canJump: boolean;
  recentInjury: boolean;
  redFlags: boolean;
  numbness?: boolean;
  nightPain?: boolean;
  unexplainedSymptoms?: boolean;
  joints: Joint[];
  disclaimerAccepted: boolean;
}

export interface TestResult {
  id: string;
  name: string;
  score: 1 | 2 | 3;
  metric?: number;
  side?: "L" | "R" | "both";
  notes?: string;
  /** False when the camera couldn't reliably score this test (no pose, no motion, skipped). */
  valid?: boolean;
  /** Bilateral tests: per-side primary metric (joint angle / sway etc.). */
  left?: number;
  right?: number;
  /** Absolute difference between sides for bilateral tests. */
  asymmetry?: number;
  /** Required camera orientation used during this test. */
  cameraView?: "front" | "side";
  /** Compensation patterns detected across the movement window (e.g. "knee valgus"). */
  compensations?: string[];
  /** Fraction of captured frames that passed the visibility threshold. */
  frameValidRatio?: number;
  /**
   * Per-camera-view breakdown when the test was captured from more than
   * one angle. Each entry corresponds to one view of the same movement.
   * The top-level `score`/`compensations` fields are the merged result
   * (min score across views, union of compensations).
   */
  viewFindings?: Array<{
    view: "front" | "side";
    score: 1 | 2 | 3;
    valid?: boolean;
    metric?: number;
    compensations?: string[];
  }>;
}

export interface ScreenSession {
  date: string;
  overall: number;
  /**
   * Sub-scores in 0–100. A value < 0 (e.g. -1) means "Insufficient data" —
   * not enough valid tests contributed to that dimension to compute a score.
   * `strength` is deprecated in v1 (cannot be measured from a camera movement
   * screen) and is kept optional only for backward compatibility with old
   * saved sessions.
   */
  sub: {
    mobility: number;
    stability: number;
    balance: number;
    quality: number;
    /** @deprecated — not measurable from the movement screen. */
    strength?: number;
  };
  movementAge: number;
  tests: TestResult[];
  conditional: Joint[];
  /** Goal at time of scan — used by rescan engine to detect goal changes. */
  goalAtScan?: Goal;
}

export interface ProgramDay { date: string; completed: boolean; }

export interface User {
  id: string;
  name: string;
  email: string;
  age: number;
  createdAt: string;
  goal?: Goal;
  questionnaire?: Questionnaire;
  premium: boolean;
  sessions: ScreenSession[];
  programDays: ProgramDay[];
  /** 1-based day indices of the current 2-week program that have been marked completed. */
  programCompletedDays?: number[];
  streak: number;
  firstRetestDone: boolean;
  programStartDate?: string;
  nextRetestDate?: string;
  phaseOverride?: "restore" | "build" | "perform";
  parq?: ParqAnswers;
  /**
   * Post-session self-report — captured after a training session. When the
   * user says "something shifted", the rescan engine surfaces an early
   * re-scan suggestion.
   */
  postSessionFeedback?: {
    date: string;
    changed: boolean;
    note?: string;
  };
}

const KEY = "smartymove.user";
const DRAFT_KEY = "smartymove.onboardingDraft";
const PENDING_PROFILE_KEY = "smartymove.pendingProfile";

export interface OnboardingDraft {
  questionnaire?: Questionnaire;
  goal?: Goal;
  parq?: ParqAnswers;
}

export function getUser(): User | null {
  if (typeof window === "undefined") return null;
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) as User : null; } catch { return null; }
}
export function setUser(u: User | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("smartymove:user"));
  if (u) void saveProfile(u).catch(() => undefined);
}
function cacheOnly(u: User | null) {
  if (typeof window === "undefined") return;
  if (u) localStorage.setItem(KEY, JSON.stringify(u));
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("smartymove:user"));
}
export function updateUser(patch: Partial<User> | ((u: User) => User)) {
  const cur = getUser(); if (!cur) return;
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  setUser(next);
}
export function getOnboardingDraft(): OnboardingDraft {
  if (typeof window === "undefined") return {};
  try { const r = localStorage.getItem(DRAFT_KEY); return r ? JSON.parse(r) as OnboardingDraft : {}; } catch { return {}; }
}
export function setOnboardingDraft(draft: OnboardingDraft) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}
export function updateOnboardingDraft(patch: Partial<OnboardingDraft> | ((draft: OnboardingDraft) => OnboardingDraft)) {
  const cur = getOnboardingDraft();
  const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
  setOnboardingDraft(next);
}
export function clearOnboardingDraft() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
export function useUser() {
  const [u, setU] = useState<User | null>(null);
  useEffect(() => {
    setU(getUser());
    const f = () => setU(getUser());
    window.addEventListener("smartymove:user", f);
    window.addEventListener("storage", f);
    return () => { window.removeEventListener("smartymove:user", f); window.removeEventListener("storage", f); };
  }, []);
  return useMemo(() => {
    if (u && isAdminEmail(u.email) && !u.premium) {
      return { ...u, premium: true };
    }
    return u;
  }, [u]);
}

export function createUser(name: string, email: string, age: number): User {
  const u: User = {
    id: crypto.randomUUID(), name, email, age,
    createdAt: new Date().toISOString(),
    premium: false, sessions: [], programDays: [], streak: 0, firstRetestDone: false,
    programStartDate: new Date().toISOString(),
  };
  setUser(u);
  return u;
}

type ProfileRow = { id: string; email: string; name: string; age: number; app_user: Partial<User> | null };

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function makeUser(id: string, name: string, email: string, age: number, existing?: Partial<User> | null): User {
  return {
    id,
    name: name.trim(),
    email: normalizeEmail(email),
    age,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    goal: existing?.goal,
    questionnaire: existing?.questionnaire,
    premium: existing?.premium ?? false,
    sessions: existing?.sessions ?? [],
    programDays: existing?.programDays ?? [],
    programCompletedDays: existing?.programCompletedDays ?? [],
    streak: existing?.streak ?? 0,
    firstRetestDone: existing?.firstRetestDone ?? false,
    programStartDate: existing?.programStartDate ?? new Date().toISOString(),
    nextRetestDate: existing?.nextRetestDate,
    phaseOverride: existing?.phaseOverride,
    parq: existing?.parq,
    postSessionFeedback: existing?.postSessionFeedback,
  };
}

function fromProfile(row: ProfileRow): User {
  return makeUser(row.id, row.name, row.email, row.age, row.app_user);
}

async function saveProfile(user: User) {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) return;
  const profile = makeUser(authUser.id, user.name, authUser.email ?? user.email, user.age, user);
  const { error } = await (supabase as any).from("profiles").upsert({
    id: authUser.id,
    email: profile.email,
    name: profile.name,
    age: profile.age,
    app_user: profile,
  });
  if (error) throw error;
  cacheOnly(profile);
}

export async function restoreUserFromBackend(): Promise<User | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const authUser = sessionData.session?.user;
  if (!authUser) return getUser();

  const { data, error } = await (supabase as any)
    .from("profiles")
    .select("id,email,name,age,app_user")
    .eq("id", authUser.id)
    .maybeSingle();
  if (error) throw error;
  if (data) {
    const user = fromProfile(data as ProfileRow);
    cacheOnly(user);
    return user;
  }

  const cached = getUser();
  const meta = authUser.user_metadata ?? {};
  const pending = getPendingProfile(authUser.email ?? "");
  const base = cached && authUser.email && normalizeEmail(cached.email) === normalizeEmail(authUser.email) ? cached : pending;
  const name = base?.name ?? meta.name ?? meta.full_name ?? (authUser.email ?? "SmartyMove user").split("@")[0];
  const age = Number(base?.age ?? meta.age ?? 18);
  const user = makeUser(authUser.id, name, authUser.email ?? base?.email ?? "", age, base);
  await saveProfile(user);
  clearPendingProfile();
  return user;
}

export async function signUpWithEmailProfile(name: string, email: string, age: number, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const draft = getOnboardingDraft();
  const partial: Partial<User> = { questionnaire: draft.questionnaire, goal: draft.goal };
  const { data, error } = await supabase.auth.signUp({
    email: normalizedEmail,
    password,
    options: {
      emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      data: { name: name.trim(), full_name: name.trim(), age },
    },
  });
  if (error) throw error;

  const user = makeUser(data.user?.id ?? crypto.randomUUID(), name, normalizedEmail, age, partial);
  setPendingProfile(user);
  if (data.session) {
    await saveProfile(user);
    clearOnboardingDraft();
    clearPendingProfile();
  } else {
    cacheOnly(user);
  }
  return user;
}

export async function signInWithEmailProfile(email: string, password: string): Promise<User> {
  const normalizedEmail = normalizeEmail(email);
  const cached = getUser();
  const { error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
  if (error) throw error;
  if (cached && normalizeEmail(cached.email) === normalizedEmail) setPendingProfile(cached);
  const user = await restoreUserFromBackend();
  if (!user) throw new Error("Signed in, but your profile could not be loaded.");
  return user;
}

export async function signOutUser() {
  await supabase.auth.signOut();
  setUser(null);
}

export function clearLocalAccountData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
  localStorage.removeItem(DRAFT_KEY);
  localStorage.removeItem(PENDING_PROFILE_KEY);
  window.dispatchEvent(new Event("smartymove:user"));
}

function setPendingProfile(user: Partial<User>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(user));
}

function getPendingProfile(email: string): Partial<User> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PENDING_PROFILE_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<User> : null;
    return parsed?.email === normalizeEmail(email) ? parsed : null;
  } catch { return null; }
}

function clearPendingProfile() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PENDING_PROFILE_KEY);
}
