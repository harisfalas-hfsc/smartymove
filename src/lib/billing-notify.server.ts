import type { SupabaseClient } from "@supabase/supabase-js";

type DB = SupabaseClient;

/**
 * Inserts a notification, ignoring duplicates via the (user_id, dedupe_key)
 * unique index. Returns true when a new row was created.
 */
export async function notifyOnce(
  db: DB,
  row: { userId: string; kind: string; title: string; body: string; dedupeKey: string },
): Promise<boolean> {
  const { error } = await db.from("notifications").insert({
    user_id: row.userId,
    kind: row.kind,
    title: row.title,
    body: row.body,
    dedupe_key: row.dedupeKey,
  } as never);
  if (!error) return true;
  // 23505 = unique violation (already sent)
  if ((error as { code?: string }).code === "23505") return false;
  throw new Error(error.message);
}

export function formatDay(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

/**
 * SmartyMove is strictly pay-per-scan — there are no recurring plans, so there
 * is nothing to remind anyone about before a renewal. Kept as a no-op so the
 * scheduled daily job stays valid if billing ever changes.
 */
export async function runRenewalReminders(_db: DB): Promise<number> {
  return 0;
}