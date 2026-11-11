/**
 * End-to-end smoke test of the server loop against a throwaway PGlite database.
 * Does not touch .data/pglite used by the dev server.
 *
 *   npm run smoke
 */
import { randomBytes, scryptSync } from "node:crypto";
import { rmSync } from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { getScenario } from "../content/scenarios";
import { getDb } from "../lib/db";
import { advanceSession, createSimulation } from "../lib/session-service";

function passwordHash(password: string): string {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString("hex")}`;
}

const dataDir = path.join(process.cwd(), ".data", "smoke");
rmSync(dataDir, { recursive: true, force: true });
process.env.PGLITE_DIR = dataDir;

function assert(condition: unknown, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
  console.log(`ok - ${message}`);
}

async function main() {
  const { db } = await getDb();
  const {
    badges,
    criterionScores,
    messages,
    notes,
    participants,
    scores,
    simSessions,
    tasks,
    users,
  } = await import("../lib/db/schema");
  const { gradeSubmission } = await import("../lib/scoring/grade");
  const { findQuote } = await import("../lib/scoring/verify");
  const { saveDraft, saveMessage, saveNote } = await import("../lib/session-service");

  assert(getScenario("adaeze-fabrics") !== undefined, "scenario loads");

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    username: "smoke_user",
    usernameLower: "smoke_user",
    passwordHash: passwordHash("sabilab12345"),
    consentAt: new Date(),
  });

  const scenario = getScenario("adaeze-fabrics")!;
  const session = await createSimulation({
    userId,
    username: "smoke_user",
    scenario,
    mode: "demo",
    teammateKeys: ["tunde"],
  });
  assert(session.id.length > 0, "session created");

  const team = await db
    .select()
    .from(participants)
    .where(eq(participants.sessionId, session.id));
  assert(team.length === 3, "student, owner and one AI teammate exist");

  const opening = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, session.id));
  assert(opening.length === 1 && opening[0].kind === "chat", "opening line saved");

  // Move the clock so the twist fires, then advance twice.
  await db
    .update(simSessions)
    .set({
      briefEndsAt: new Date(Date.now() - 20_000),
      huddleEndsAt: new Date(Date.now() + 60_000),
      twistAt: new Date(Date.now() - 10_000),
    })
    .where(eq(simSessions.id, session.id));

  const [fresh] = await db
    .select()
    .from(simSessions)
    .where(eq(simSessions.id, session.id));
  const advanced = await advanceSession(fresh);
  assert(advanced.state === "huddle", "brief advances to huddle");
  const afterTwist = await db
    .select()
    .from(messages)
    .where(eq(messages.sessionId, session.id));
  assert(
    afterTwist.some((message) => message.kind === "twist"),
    "twist fires once and is stored",
  );

  const note = await saveNote({ sessionId: session.id, objectId: "ledger" });
  assert(note?.label === "Ledger", "object inspection saves a note");
  const duplicate = await saveNote({ sessionId: session.id, objectId: "ledger" });
  assert(duplicate?.id === note?.id, "inspecting twice does not duplicate the note");
  const noteCount = await db.select().from(notes).where(eq(notes.sessionId, session.id));
  assert(noteCount.length === 1, "one note row for one object");

  const ai = team.find((member) => member.kind === "ai")!;
  const reply = await saveMessage({
    sessionId: session.id,
    participantId: ai.id,
    body: "Ten per cent is the most I can defend.",
  });
  assert(reply?.authorName === "Tunde", "AI reply joins to its author");

  await saveDraft({
    sessionId: session.id,
    userId,
    body: "Draft before submission.",
  });
  const [draft] = await db.select().from(tasks).where(eq(tasks.sessionId, session.id));
  assert(draft.body === "Draft before submission.", "draft autosaves");

  const answer =
    "I would offer Mrs Bello 10% off, which is ₦100,000, and keep the rest as a credit for her next order. I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday. That leaves cash for the 2pm delivery, so we keep the customer and protect the rent.";

  await gradeSubmission({ session, userId, body: answer });

  const [storedTask] = await db.select().from(tasks).where(eq(tasks.sessionId, session.id));
  const [storedScore] = await db.select().from(scores).where(eq(scores.taskId, storedTask.id));
  assert(Boolean(storedScore), "score stored");
  assert(storedScore.needsReview === true, "stub score is flagged for review");

  const criteria = await db
    .select()
    .from(criterionScores)
    .where(eq(criterionScores.scoreId, storedScore.id));
  assert(criteria.length === 4, "four criteria stored");
  assert(
    criteria.every(
      (criterion) =>
        !criterion.quote || findQuote(answer, criterion.quote) !== null,
    ),
    "every stored quote verifies against the submission",
  );
  assert(
    criteria.every((criterion) => criterion.level !== "advanced"),
    "no level above Proficient",
  );

  const badge = await db.select().from(badges).where(eq(badges.sessionId, session.id));
  assert(badge.length === 1, "badge awarded when every dimension reaches Foundation");

  const [closed] = await db
    .select()
    .from(simSessions)
    .where(eq(simSessions.id, session.id));
  assert(closed.state === "scored", "session moves to scored");

  await db.delete(users).where(eq(users.id, userId));
  const leftoverSessions = await db
    .select()
    .from(simSessions)
    .where(eq(simSessions.userId, userId));
  assert(leftoverSessions.length === 0, "deleting the user cascades sessions");

  console.log("\nSmoke test passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
