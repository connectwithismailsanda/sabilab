import { and, asc, eq } from "drizzle-orm";
import { getPhase } from "@/lib/clock";
import { recordEvent } from "@/lib/analytics";
import { getDb } from "@/lib/db";
import { messages, participants } from "@/lib/db/schema";
import { json, sameOrigin, withSession } from "@/lib/http";
import {
  getMessages,
  getSession,
  personaReply,
  saveMessage,
} from "@/lib/session-service";
import { getScenario } from "@/content/scenarios";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "Bad origin." }, 403);

  const { id } = await params;
  const gate = await withSession(id);
  if (!gate.ok) return gate.response;

  const { db } = await getDb();
  const session = await getSession(gate.user.id, id);
  if (!session) return json({ error: "Session not found." }, 404);

  const phase = getPhase(session);
  if (phase === "brief") {
    return json({ error: "The huddle has not started yet." }, 409);
  }
  if (phase === "scored") {
    return json({ error: "This session is closed." }, 409);
  }

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!body) return json({ error: "Write a message first." }, 400);
  if (body.length > 2000) return json({ error: "That message is too long." }, 400);

  const [student] = await db
    .select({ id: participants.id })
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, id),
        eq(participants.kind, "student"),
      ),
    )
    .limit(1);

  const [teammate] = await db
    .select({
      id: participants.id,
      name: participants.displayName,
      personaKey: participants.personaKey,
    })
    .from(participants)
    .where(and(eq(participants.sessionId, id), eq(participants.kind, "ai")))
    .orderBy(asc(participants.seat))
    .limit(1);

  if (!student || !teammate) {
    return json({ error: "Team is not configured." }, 409);
  }

  const studentMessage = await saveMessage({
    sessionId: id,
    participantId: student.id,
    body,
  });

  const scenario = getScenario(session.scenarioSlug);
  const previous = await db
    .select({ id: messages.id })
    .from(messages)
    .where(
      and(eq(messages.sessionId, id), eq(messages.participantId, student.id)),
    );

  const replyBody = scenario
    ? personaReply(
        scenario,
        teammate.personaKey ?? "tunde",
        body,
        Math.max(0, previous.length - 1),
      )
    : "I am here. Say that again?";

  const reply = await saveMessage({
    sessionId: id,
    participantId: teammate.id,
    body: replyBody,
  });

  await recordEvent("message_sent", {
    sessionId: id,
    userId: gate.user.id,
    payload: { characters: body.length },
  });

  return json({
    messages: [studentMessage, reply].filter(Boolean),
    all: await getMessages(id),
  });
}
