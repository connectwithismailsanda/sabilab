import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { getScenario, type Persona, type Scenario } from "@/content/scenarios";
import { getDb } from "@/lib/db";
import {
  messages,
  notes,
  participants,
  simSessions,
  tasks,
  type SimSession,
} from "@/lib/db/schema";

export type ChatMessage = {
  id: string;
  body: string;
  kind: string;
  createdAt: Date;
  authorName: string | null;
  authorKind: string | null;
  participantId: string | null;
};

export type SessionBundle = {
  session: SimSession;
  scenario: Scenario;
  teammates: {
    id: string;
    name: string;
    personaKey: string | null;
    kind: string;
  }[];
  messages: ChatMessage[];
  notes: {
    id: string;
    objectId: string;
    label: string;
    text: string;
  }[];
  task: { body: string; submittedAt: Date | null } | null;
};

export async function createSimulation(input: {
  userId: string;
  username: string;
  scenario: Scenario;
  mode: "demo" | "full";
  teammateKeys: string[];
}): Promise<SimSession> {
  const { db } = await getDb();
  const demo = input.mode === "demo";

  const startedAt = new Date();
  const briefMs = demo ? 30_000 : 180_000;
  const huddleMs = demo ? 90_000 : 900_000;
  const taskMs = demo ? 180_000 : 300_000;

  const briefEndsAt = new Date(startedAt.getTime() + briefMs);
  const huddleEndsAt = new Date(briefEndsAt.getTime() + huddleMs);
  const endsAt = new Date(huddleEndsAt.getTime() + taskMs);
  const twistAt = new Date(briefEndsAt.getTime() + huddleMs / 2);

  const sessionId = crypto.randomUUID();

  await db.insert(simSessions).values({
    id: sessionId,
    userId: input.userId,
    scenarioSlug: input.scenario.slug,
    mode: input.mode,
    state: "brief",
    startedAt,
    briefEndsAt,
    huddleEndsAt,
    endsAt,
    twistAt,
  });

  const ownerId = crypto.randomUUID();
  await db.insert(participants).values([
    {
      id: crypto.randomUUID(),
      sessionId,
      kind: "student",
      displayName: input.username,
      personaKey: null,
      seat: 0,
    },
    {
      id: ownerId,
      sessionId,
      kind: "owner",
      displayName: input.scenario.owner,
      personaKey: "owner",
      seat: 9,
    },
  ]);

  const chosen =
    input.teammateKeys.length > 0
      ? input.scenario.personas.filter((persona) =>
          input.teammateKeys.includes(persona.key),
        )
      : [input.scenario.personas[0]];

  if (chosen.length > 0) {
    await db.insert(participants).values(
      chosen.map((persona, index) => ({
        id: crypto.randomUUID(),
        sessionId,
        kind: "ai",
        displayName: persona.name,
        personaKey: persona.key,
        seat: index + 1,
      })),
    );
  }

  await db.insert(messages).values({
    id: crypto.randomUUID(),
    sessionId,
    participantId: ownerId,
    body: input.scenario.opening.body,
    kind: "chat",
  });

  return {
    id: sessionId,
    userId: input.userId,
    scenarioSlug: input.scenario.slug,
    mode: input.mode,
    state: "brief",
    startedAt,
    briefEndsAt,
    huddleEndsAt,
    endsAt,
    twistAt,
    twistFiredAt: null,
    submittedAt: null,
    graceUsed: false,
    createdAt: startedAt,
  };
}

export async function getSession(
  userId: string,
  sessionId: string,
): Promise<SimSession | null> {
  const { db } = await getDb();
  const [session] = await db
    .select()
    .from(simSessions)
    .where(and(eq(simSessions.id, sessionId), eq(simSessions.userId, userId)))
    .limit(1);
  return session ?? null;
}

/**
 * Lazily moves a session through brief → huddle → task and fires the twist once.
 * Called from the pages and the polling endpoint, so no background worker is needed
 * for the demo.
 */
export async function advanceSession(session: SimSession): Promise<SimSession> {
  const { db } = await getDb();
  const now = new Date();
  let state = session.state;
  let twistFiredAt = session.twistFiredAt;

  if (state === "brief" && now >= session.briefEndsAt) {
    state = "huddle";
    await db
      .update(simSessions)
      .set({ state })
      .where(eq(simSessions.id, session.id));
  }

  if (state === "huddle" && now >= session.huddleEndsAt) {
    state = "task";
    await db
      .update(simSessions)
      .set({ state })
      .where(eq(simSessions.id, session.id));
  }

  if (
    !twistFiredAt &&
    now >= session.twistAt &&
    (state === "huddle" || state === "task")
  ) {
    const [claimed] = await db
      .update(simSessions)
      .set({ twistFiredAt: now })
      .where(
        and(eq(simSessions.id, session.id), isNull(simSessions.twistFiredAt)),
      )
      .returning({ id: simSessions.id });

    if (claimed) {
      twistFiredAt = now;
      const scenario = getScenario(session.scenarioSlug);
      const [owner] = await db
        .select({ id: participants.id })
        .from(participants)
        .where(
          and(
            eq(participants.sessionId, session.id),
            eq(participants.kind, "owner"),
          ),
        )
        .limit(1);

      if (scenario && owner) {
        await db.insert(messages).values({
          id: crypto.randomUUID(),
          sessionId: session.id,
          participantId: owner.id,
          body: scenario.twist.body,
          kind: "twist",
        });
      }
    }
  }

  return { ...session, state, twistFiredAt };
}

export async function getBundle(
  userId: string,
  sessionId: string,
): Promise<SessionBundle | null> {
  const session = await getSession(userId, sessionId);
  if (!session) return null;

  const scenario = getScenario(session.scenarioSlug);
  if (!scenario) return null;

  const updated = await advanceSession(session);
  const { db } = await getDb();

  const [teamRows, messageRows, noteRows, taskRows] = await Promise.all([
    db
      .select()
      .from(participants)
      .where(eq(participants.sessionId, sessionId))
      .orderBy(asc(participants.seat)),
    db
      .select({
        id: messages.id,
        body: messages.body,
        kind: messages.kind,
        createdAt: messages.createdAt,
        authorName: participants.displayName,
        authorKind: participants.kind,
        participantId: messages.participantId,
      })
      .from(messages)
      .leftJoin(participants, eq(messages.participantId, participants.id))
      .where(eq(messages.sessionId, sessionId))
      .orderBy(asc(messages.createdAt)),
    db
      .select()
      .from(notes)
      .where(eq(notes.sessionId, sessionId))
      .orderBy(asc(notes.createdAt)),
    db
      .select({ body: tasks.body, submittedAt: tasks.submittedAt })
      .from(tasks)
      .where(eq(tasks.sessionId, sessionId))
      .limit(1),
  ]);

  return {
    session: updated,
    scenario,
    teammates: teamRows
      .filter((row) => row.kind !== "owner")
      .map((row) => ({
        id: row.id,
        name: row.displayName,
        personaKey: row.personaKey,
        kind: row.kind,
      })),
    messages: messageRows,
    notes: noteRows.map((row) => ({
      id: row.id,
      objectId: row.objectId,
      label: row.label,
      text: row.text,
    })),
    task: taskRows[0] ?? null,
  };
}

export async function getMessages(
  sessionId: string,
): Promise<ChatMessage[]> {
  const { db } = await getDb();
  return db
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      authorName: participants.displayName,
      authorKind: participants.kind,
      participantId: messages.participantId,
    })
    .from(messages)
    .leftJoin(participants, eq(messages.participantId, participants.id))
    .where(eq(messages.sessionId, sessionId))
    .orderBy(asc(messages.createdAt));
}

export async function saveMessage(input: {
  sessionId: string;
  participantId: string;
  body: string;
  kind?: "chat" | "twist" | "system";
}): Promise<ChatMessage | null> {
  const { db } = await getDb();
  const id = crypto.randomUUID();
  await db.insert(messages).values({
    id,
    sessionId: input.sessionId,
    participantId: input.participantId,
    body: input.body,
    kind: input.kind ?? "chat",
  });

  const [row] = await db
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      authorName: participants.displayName,
      authorKind: participants.kind,
      participantId: messages.participantId,
    })
    .from(messages)
    .leftJoin(participants, eq(messages.participantId, participants.id))
    .where(eq(messages.id, id))
    .limit(1);

  return row ?? null;
}

export function personaReply(
  scenario: Scenario,
  personaKey: string,
  body: string,
  turn: number,
): string {
  const persona = scenario.personas.find((item) => item.key === personaKey);
  const lower = body.toLowerCase();

  if (persona) {
    const topic = persona.topics.find((item) =>
      item.match.some((word) => lower.includes(word.toLowerCase())),
    );
    if (topic) return topic.reply;
    return persona.fallback[turn % persona.fallback.length];
  }

  return "Give me the numbers and I will tell you what I think.";
}

export function getPersona(
  scenario: Scenario,
  personaKey: string,
): Persona | undefined {
  return scenario.personas.find((item) => item.key === personaKey);
}

export async function saveNote(input: {
  sessionId: string;
  objectId: string;
}): Promise<{ id: string; label: string; text: string } | null> {
  const { db } = await getDb();
  const [session] = await db
    .select({ scenarioSlug: simSessions.scenarioSlug })
    .from(simSessions)
    .where(eq(simSessions.id, input.sessionId))
    .limit(1);
  if (!session) return null;

  const scenario = getScenario(session.scenarioSlug);
  const object = scenario?.objects.find((item) => item.id === input.objectId);
  if (!object) return null;

  await db
    .insert(notes)
    .values({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      objectId: object.id,
      label: object.label,
      text: object.text,
    })
    .onConflictDoNothing();

  const [row] = await db
    .select({ id: notes.id, label: notes.label, text: notes.text })
    .from(notes)
    .where(
      and(eq(notes.sessionId, input.sessionId), eq(notes.objectId, object.id)),
    )
    .limit(1);

  return row ?? null;
}

export async function saveDraft(input: {
  sessionId: string;
  userId: string;
  body: string;
}): Promise<void> {
  const { db } = await getDb();
  const wordCount = input.body.trim()
    ? input.body.trim().split(/\s+/).length
    : 0;

  await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      sessionId: input.sessionId,
      userId: input.userId,
      body: input.body,
      wordCount,
      draftUpdatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tasks.sessionId,
      set: {
        body: input.body,
        wordCount,
        draftUpdatedAt: new Date(),
      },
    });
}

export async function getRecentSessions(
  userId: string,
  limit = 8,
): Promise<SimSession[]> {
  const { db } = await getDb();
  return db
    .select()
    .from(simSessions)
    .where(eq(simSessions.userId, userId))
    .orderBy(desc(simSessions.createdAt))
    .limit(limit);
}
