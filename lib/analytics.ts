import { getDb } from "@/lib/db";
import { events } from "@/lib/db/schema";

/** Fire-and-forget product analytics. Never let a logging failure break a session. */
export async function recordEvent(
  type: string,
  input: { sessionId?: string; userId?: string; payload?: unknown } = {},
): Promise<void> {
  try {
    const { db } = await getDb();
    await db.insert(events).values({
      id: crypto.randomUUID(),
      sessionId: input.sessionId ?? null,
      userId: input.userId ?? null,
      type,
      payload: input.payload ?? null,
    });
  } catch (error) {
    console.error("analytics_failed", type, error);
  }
}
