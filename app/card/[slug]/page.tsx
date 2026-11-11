import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, isNull } from "drizzle-orm";
import {
  dimensionLabels,
  getScenario,
  levelLabels,
  type Dimension,
  type Level,
} from "@/content/scenarios";
import { getDb } from "@/lib/db";
import {
  criterionScores,
  evidenceCards,
  scores,
  simSessions,
  tasks,
  users,
} from "@/lib/db/schema";

const levelStyle: Record<Level, string> = {
  proficient: "bg-accent text-white",
  foundation: "bg-mint text-accent-dark",
  needs_practice: "bg-amber-soft text-[#7a5305]",
  insufficient_evidence: "bg-cream text-muted",
};

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { db } = await getDb();

  const [card] = await db
    .select({
      id: evidenceCards.id,
      publicSlug: evidenceCards.publicSlug,
      visibility: evidenceCards.visibility,
      createdAt: evidenceCards.createdAt,
      sessionId: simSessions.id,
      scenarioSlug: simSessions.scenarioSlug,
      username: users.username,
    })
    .from(evidenceCards)
    .innerJoin(simSessions, eq(evidenceCards.sessionId, simSessions.id))
    .innerJoin(users, eq(evidenceCards.userId, users.id))
    .where(
      and(
        eq(evidenceCards.publicSlug, slug),
        isNull(evidenceCards.revokedAt),
      ),
    )
    .limit(1);

  if (!card) notFound();

  const scenario = getScenario(card.scenarioSlug);
  const [task] = await db
    .select({ id: tasks.id, submittedAt: tasks.submittedAt })
    .from(tasks)
    .where(eq(tasks.sessionId, card.sessionId))
    .limit(1);

  const [score] = task
    ? await db.select().from(scores).where(eq(scores.taskId, task.id)).limit(1)
    : [];

  const criteria = score
    ? await db
        .select()
        .from(criterionScores)
        .where(eq(criterionScores.scoreId, score.id))
        .orderBy(asc(criterionScores.dimension))
    : [];

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const engine = score?.summary?.engine === "llm" ? "llm" : "rule-based";
  const rubricStatus = score?.summary?.rubricStatus;
  const rubricIsStub =
    rubricStatus === "stub" ||
    (!rubricStatus && (score?.rubricVersion.startsWith("stub") ?? true));
  const rubricIsDraft = rubricStatus === "draft";

  return (
    <div className="min-h-dvh bg-cream">
      <header className="bg-ink text-white">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <span className="font-bold">SabiLab · Evidence Card</span>
          <span className="chip bg-white/10 text-mint">Public link</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <section className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="label">Prepared by</p>
              <h1 className="mt-1 text-2xl font-bold">{card.username}</h1>
              <p className="mt-1 text-sm text-muted">
                {scenario?.title ?? card.scenarioSlug} ·{" "}
                {scenario?.role ?? "Simulation"} ·{" "}
                {formatter.format(task?.submittedAt ?? card.createdAt)}
              </p>
            </div>
            <span className="chip bg-amber-soft text-[#7a5305]">
              Human-verified: not yet
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-cream p-4 text-sm">
            <p className="font-semibold">
              {engine === "llm"
                ? "AI-assessed and experimental"
                : "Rule-based and experimental"}
            </p>
            <p className="mt-1 text-muted">
              Each level is backed by the student&apos;s own words. An{" "}
              {engine === "llm" ? "AI" : "automated"} score is never final: a
              human reviewer has not verified this card.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          {criteria.map((criterion) => {
            const level = criterion.level as Level;
            return (
              <article key={criterion.id} className="panel p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-bold">
                    {dimensionLabels[criterion.dimension as Dimension] ??
                      criterion.dimension}
                  </h2>
                  <span className={`chip ${levelStyle[level]}`}>
                    {levelLabels[level] ?? level}
                  </span>
                </div>
                {card.visibility?.quotes && criterion.quote ? (
                  <blockquote className="prose-quote mt-3 text-sm">
                    “{criterion.quote}”
                  </blockquote>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    {criterion.quote
                      ? "This student has hidden the quote for this level."
                      : "Insufficient evidence."}
                  </p>
                )}
                <p className="mt-2 text-xs text-muted">
                  {criterion.rationale}
                </p>
              </article>
            );
          })}
        </section>

        <section className="panel p-5 text-sm">
          <h2 className="font-bold">What this card does and does not claim</h2>
          <ul className="mt-2 space-y-1.5 text-muted">
            <li>Levels are capped at Proficient. No scorer awards a higher level.</li>
            <li>Every shown quote was checked as an exact substring of the submission.</li>
            <li>Spelling, grammar and writing style are not scored.</li>
            <li>
              {rubricIsStub
                ? "Scores come from a provisional rule fallback that reads the task answer only. Thresholds are proposals, not calibrated benchmarks."
                : rubricIsDraft
                  ? "Scores come from SabiLab rubric v0.2, which is still a draft. Thresholds are proposals until calibrated against human raters."
                  : "Scores come from a calibrated rubric. Thresholds are documented and reproducible."}
            </li>
            <li>
              The account is a username only. SabiLab has not verified identity or
              employment history.
            </li>
            <li>The student can revoke this link at any time.</li>
          </ul>
        </section>

        <p className="pb-6 text-center text-xs text-muted">
          Prototype · {formatter.format(card.createdAt)} · SabiLab
        </p>
      </main>
    </div>
  );
}
