import { useEffect, useState } from "react";
import { isAdminEmail } from "./admin";

export type Joint = "ankle" | "knee" | "hip" | "back" | "shoulder" | "elbow" | "wrist" | "none";
export type Pain = "none" | "mild" | "moderate" | "severe";
export type Goal = "reduce_pain" | "prevent_injury" | "start_sport" | "perform_better" | "feel_better";

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
}

export interface ScreenSession {
  date: string;
  overall: number;
  sub: { mobility: number; stability: number; balance: number; quality: number; strength: number };
  movementAge: number;
  tests: TestResult[];
  conditional: Joint[];
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
  streak: number;
  firstRetestDone: boolean;
  programStartDate?: string;
  nextRetestDate?: string;
  phaseOverride?: "restore" | "build" | "perform";
}

const KEY = "smartymove.user";
const DRAFT_KEY = "smartymove.onboardingDraft";

export interface OnboardingDraft {
  questionnaire?: Questionnaire;
  goal?: Goal;
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
  if (u && isAdminEmail(u.email) && !u.premium) {
    return { ...u, premium: true };
  }
  return u;
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
