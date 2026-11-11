import { and, asc, eq } from "drizzle-orm";
import { getScenario } from "@/content/scenarios";
import { getDb } from "@/lib/db";
import {
  badges,
  criterionScores,
  messages,
  participants,
  simSessions,
  scores,
  tasks,
  type SimSession,
} from "@/lib/db/schema";
import { recordEvent } from "@/lib/analytics";
import { scoreSubmission } from "./index";
import type { Transcript, TranscriptRole } from "./types";

const rank: Record<string, number> = {
  insufficient_evidence: 0,
  needs_practice: 1,
  foundation: 2,
  proficient: 3,
};

function redactPhoneNumbers(text: string): string {
  return text.replace(/\b(?:\+?234|0)\d{9,10}\b/g, "[phone number removed]");
}

function roleFor(kind: string | null): TranscriptRole {
  if (kind === "student") return "student";
  if (kind === "owner") return "owner";
  return "teammate";
}

/**
 * Grades one submission and stores the evidence.
 *
 * The engine is chosen in `lib/scoring/index.ts`: LLM when configured, rule
 * fallback otherwise. The chosen model, prompt version and rubric version are
 * stored on every score so a result can always be explained later.
 */
export async function gradeSubmission(input: {
  session: SimSession;
  userId: string;
  body: string;
}): Promise<string> {
  const scenario = getScenario(input.session.scenarioSlug);
  if (!scenario) throw new Error("Unknown scenario");

  const db = (await getDb()).db;
  const now = new Date();
  const wordCount = input.body.trim()
    ? input.body.trim().split(/\s+/).length
    : 0;

  const [student] = await db
    .select({
      id: participants.id,
      displayName: participants.displayName,
    })
    .from(participants)
    .where(
      and(
        eq(participants.sessionId, input.session.id),
        eq(participants.kind, "student"),
      ),
    )
    .limit(1);

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      authorKind: participants.kind,
      authorName: participants.displayName,
    })
    .from(messages)
    .leftJoin(participants, eq(messages.participantId, participants.id))
    .where(eq(messages.sessionId, input.session.id))
    .orderBy(asc(messages.createdAt));

  const transcript: Transcript = {
    studentName: student?.displayName ?? "the student",
    taskId: "task",
    messages: [
      ...rows
        .filter((row) => row.kind !== "system")
        .map((row) => ({
          id: row.id,
          role: roleFor(row.authorKind),
          speaker: row.authorName ?? "Teammate",
          text: redactPhoneNumbers(row.body),
          createdAt: row.createdAt.toISOString(),
        })),
      {
        id: "task",
        role: "student" as const,
        speaker: student?.displayName ?? "the student",
        text: redactPhoneNumbers(input.body),
        createdAt: now.toISOString(),
      },
    ],
  };

  const [task] = await db
    .insert(tasks)
    .values({
      id: crypto.randomUUID(),
      sessionId: input.session.id,
      userId: input.userId,
      body: input.body,
      wordCount,
      submittedAt: now,
      draftUpdatedAt: now,
    })
    .onConflictDoUpdate({
      target: tasks.sessionId,
      set: {
        body: input.body,
        wordCount,
        submittedAt: now,
        draftUpdatedAt: now,
      },
    })
    .returning({ id: tasks.id });

  // Re-submitting replaces the previous result and badge.
  const existing = await db
    .select({ id: scores.id })
    .from(scores)
    .where(eq(scores.taskId, task.id))
    .limit(1);

  if (existing[0]) {
    await db.delete(scores).where(eq(scores.id, existing[0].id));
    await db.delete(badges).where(eq(badges.sessionId, input.session.id));
  }

  const { result, meta } = await scoreSubmission(scenario, transcript);
  const scoreId = crypto.randomUUID();

  await db.insert(scores).values({
    id: scoreId,
    taskId: task.id,
    model: meta.model,
    promptVersion: meta.promptVersion,
    rubricVersion: meta.rubricVersion,
    confidence: result.overallConfidence,
    needsReview: result.needsReview,
    summary: result.summary,
  });

  await db.insert(criterionScores).values(
    result.criteria.map((criterion) => ({
      id: crypto.randomUUID(),
      scoreId,
      dimension: criterion.dimension,
      level: criterion.level,
      quote: criterion.quote,
      rationale: criterion.rationale,
      confidence: criterion.confidence,
      verified: criterion.verified,
      startOffset: criterion.startOffset,
      endOffset: criterion.endOffset,
    })),
  );

  const levels = result.criteria.map((criterion) => criterion.level);
  const canAward = levels.every((level) => rank[level] >= 2);
  const clarification = result.summary.needsClarification;

  if (!clarification && canAward) {
    const lowest = result.criteria.reduce((current, criterion) =>
      rank[criterion.level] < rank[current.level] ? criterion : current,
    );
    await db.insert(badges).values({
      id: crypto.randomUUID(),
      userId: input.userId,
      sessionId: input.session.id,
      dimension: "overall",
      level: lowest.level,
      tier:
        meta.engine === "llm"
          ? "AI-assessed · provisional"
          : "Rule-based · provisional",
    });
  }

  // A clarification is not a result. Keep the session in the task phase so the
  // student can answer and resubmit without a redirect loop.
  await db
    .update(simSessions)
    .set({
      state: clarification ? "task" : "scored",
      submittedAt: now,
    })
    .where(eq(simSessions.id, input.session.id));

  await recordEvent(
    clarification ? "clarification_requested" : "score_ready",
    {
      sessionId: input.session.id,
      userId: input.userId,
      payload: {
        scoreId,
        engine: meta.engine,
        ...(clarification
          ? { questions: result.summary.clarifyingQuestions ?? [] }
          : {
              levels: Object.fromEntries(
                result.criteria.map((criterion) => [
                  criterion.dimension,
                  criterion.level,
                ]),
              ),
            }),
      },
    },
  );

  return scoreId;
}
