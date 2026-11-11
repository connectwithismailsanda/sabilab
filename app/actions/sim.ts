"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getScenario } from "@/content/scenarios";
import { recordEvent } from "@/lib/analytics";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { evidenceCards, simSessions } from "@/lib/db/schema";
import { gradeSubmission } from "@/lib/scoring/grade";
import {
  createSimulation,
  getSession,
  saveDraft,
} from "@/lib/session-service";

export async function startSessionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const slug = String(formData.get("slug") ?? "");
  const mode = formData.get("mode") === "full" ? "full" : "demo";
  const teammateKeys = formData
    .getAll("teammates")
    .map(String)
    .filter(Boolean)
    .slice(0, 2);

  const scenario = getScenario(slug);
  if (!scenario) redirect("/home");

  const session = await createSimulation({
    userId: user.id,
    username: user.username,
    scenario,
    mode,
    teammateKeys,
  });

  await recordEvent("session_created", {
    sessionId: session.id,
    userId: user.id,
    payload: { scenario: slug, mode, teammates: teammateKeys.length },
  });

  redirect(`/session/${session.id}/brief`);
}

export async function enterWorkspaceAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  const session = await getSession(user.id, sessionId);
  if (!session) redirect("/home");

  if (session.state === "brief") {
    const { db } = await getDb();
    await db
      .update(simSessions)
      .set({ state: "huddle" })
      .where(eq(simSessions.id, session.id));
  }

  redirect(`/session/${session.id}/workspace`);
}

export async function goToTaskAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  const session = await getSession(user.id, sessionId);
  if (!session) redirect("/home");

  const { db } = await getDb();
  await db
    .update(simSessions)
    .set({ state: "task" })
    .where(eq(simSessions.id, session.id));

  redirect(`/session/${session.id}/task`);
}

export async function submitTaskAction(
  sessionId: string,
  formData: FormData,
): Promise<void> {
  const user = await requireUser();
  const session = await getSession(user.id, sessionId);
  if (!session) redirect("/home");

  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 40) {
    redirect(`/session/${sessionId}/task?error=short`);
  }

  await saveDraft({ sessionId, userId: user.id, body });
  await recordEvent("task_submitted", {
    sessionId,
    userId: user.id,
    payload: { characters: body.length },
  });

  await gradeSubmission({ session, userId: user.id, body });
  revalidatePath(`/session/${sessionId}/results`);
  redirect(`/session/${sessionId}/results`);
}

export async function publishCardAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  const session = await getSession(user.id, sessionId);
  if (!session) redirect("/home");

  const { db } = await getDb();
  const [existing] = await db
    .select()
    .from(evidenceCards)
    .where(
      and(
        eq(evidenceCards.sessionId, sessionId),
        eq(evidenceCards.userId, user.id),
      ),
    )
    .limit(1);

  if (!existing) {
    await db.insert(evidenceCards).values({
      id: crypto.randomUUID(),
      userId: user.id,
      sessionId,
      publicSlug: randomBytes(16).toString("base64url"),
      visibility: { quotes: true },
    });
    await recordEvent("card_published", {
      sessionId,
      userId: user.id,
    });
  } else if (existing.revokedAt) {
    await db
      .update(evidenceCards)
      .set({ revokedAt: null })
      .where(eq(evidenceCards.id, existing.id));
  }

  revalidatePath(`/session/${sessionId}/results`);
  redirect(`/session/${sessionId}/results`);
}

export async function revokeCardAction(sessionId: string): Promise<void> {
  const user = await requireUser();
  const { db } = await getDb();
  await db
    .update(evidenceCards)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(evidenceCards.sessionId, sessionId),
        eq(evidenceCards.userId, user.id),
      ),
    );

  revalidatePath(`/session/${sessionId}/results`);
  redirect(`/session/${sessionId}/results`);
}
