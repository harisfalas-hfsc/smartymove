import { createStore, get, set } from "idb-keyval";

export type QueuedAction = {
  id: string;
  userId?: string;
  kind: "profile-sync" | "notifications-read";
  payload: Record<string, unknown>;
  queuedAt: number;
};

const QUEUE_KEY = "pending-actions";
const store =
  typeof indexedDB !== "undefined" ? createStore("smartymove-offline", "queue") : undefined;

async function readQueue(): Promise<QueuedAction[]> {
  if (!store) return [];
  try {
    return (await get<QueuedAction[]>(QUEUE_KEY, store)) ?? [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedAction[]) {
  if (!store) return;
  try {
    await set(QUEUE_KEY, items, store);
  } catch {
    /* ignore */
  }
}

export async function enqueueAction(
  kind: QueuedAction["kind"],
  payload: Record<string, unknown>,
  userId?: string | null,
): Promise<void> {
  const items = await readQueue();
  // One pending profile sync per user is enough — the local profile is the
  // full source of truth and always uploaded whole.
  const deduped = kind === "profile-sync" ? items.filter((a) => a.kind !== "profile-sync" || a.userId !== (userId ?? undefined)) : items;
  deduped.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId: userId ?? undefined,
    kind,
    payload,
    queuedAt: Date.now(),
  });
  await writeQueue(deduped);
}

export async function pendingActionCount(): Promise<number> {
  return (await readQueue()).length;
}

/**
 * Replays queued offline actions in order. Successful ones are removed;
 * anything that fails again stays queued for the next reconnect.
 */
export async function flushQueue(
  run: (action: QueuedAction) => Promise<void>,
  userId?: string | null,
): Promise<number> {
  const items = await readQueue();
  if (!items.length) return 0;
  const remaining: QueuedAction[] = [];
  let done = 0;
  for (const action of items) {
    if (action.userId && action.userId !== userId) {
      remaining.push(action);
      continue;
    }
    try {
      await run(action);
      done += 1;
    } catch {
      remaining.push(action);
    }
  }
  await writeQueue(remaining);
  return done;
}
