import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { publishCardAction, revokeCardAction } from "@/app/actions/sim";
import {
  dimensionLabels,
  levelLabels,
  type Dimension,
  type Level,
} from "@/content/scenarios";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  badges,
  criterionScores,
  evidenceCards,
  scores,
  tasks,
} from "@/lib/db/schema";
import { recommendations } from "@/lib/recommendations";
import { getBundle } from "@/lib/session-service";

export const dynamic = "force-dynamic";

const levelStyle: Record<Level, string> = {
  proficient: "bg-accent text-white",
  foundation: "bg-mint text-accent-dark",
  needs_practice: "bg-amber-soft text-[#7a5305]",
  insufficient_evidence: "bg-cream text-muted",
};

const order: Dimension[] = [
  "role_skill",
  "communication",
  "leadership",
  "creative_thinking",
];

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const bundle = await getBundle(user.id, id);
  if (!bundle) notFound();

  const { db } = await getDb();
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.sessionId, id))
    .limit(1);

  if (!task?.submittedAt) redirect(`/session/${id}/task`);

  const [score] = await db
    .select()
    .from(scores)
    .where(eq(scores.taskId, task.id))
    .limit(1);

  if (!score) redirect(`/session/${id}/task`);

  const criteria = await db
    .select()
    .from(criterionScores)
    .where(eq(criterionScores.scoreId, score.id))
    .orderBy(asc(criterionScores.dimension));

  const [badge] = await db
    .select()
    .from(badges)
    .where(eq(badges.sessionId, id))
    .limit(1);

  const [card] = await db
    .select()
    .from(evidenceCards)
    .where(eq(evidenceCards.sessionId, id))
    .limit(1);

  const ordered = order
    .map((dimension) => criteria.find((item) => item.dimension === dimension))
    .filter((item): item is (typeof criteria)[number] => Boolean(item));

  const weakest =
    (score.summary?.improvements?.[0] as Dimension | undefined) ??
    "communication";
  const recommendation = recommendations[weakest] ?? recommendations.communication;

  const publish = publishCardAction.bind(null, id);
  const revoke = revokeCardAction.bind(null, id);
  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });

  const published = card && !card.revokedAt;
  const engine = score.summary?.engine === "llm" ? "llm" : "rule-based";
  const needsClarification = score.summary?.needsClarification === true;
  const questions = score.summary?.clarifyingQuestions ?? [];
  const rubricStatus = score.summary?.rubricStatus;
  const rubricIsStub =
    rubricStatus === "stub" ||
    (!rubricStatus && score.rubricVersion.startsWith("stub"));
  const rubricIsDraft = rubricStatus === "draft";
  const criterionDetails = score.summary?.criteria ?? [];
  const feedback = score.summary?.feedback;
  const hasFeedback = Boolean(
    feedback &&
      (feedback.strengthQuote || feedback.improvement || feedback.rewrite),
  );

  if (needsClarification) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="label">
            {bundle.scenario.title} · {bundle.scenario.role}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">One quick check</h1>
          <p className="mt-1 text-sm text-muted">
            Nothing has been scored yet. Your answer is saved.
          </p>
        </div>

        <section className="panel border-amber/50 bg-amber-soft p-5">
          <p className="label text-[#7a5305]">Before we score</p>
          <p className="mt-1 text-sm">
            We need a little more so the feedback is based on what you meant,
            not a guess.
          </p>
          <ol className="mt-3 space-y-2 text-sm">
            {questions.map((question, index) => (
              <li key={question} className="flex gap-2">
                <span className="font-semibold text-[#7a5305]">
                  {index + 1}.
                </span>
                <span>{question}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel p-5 text-sm text-muted">
          <p>
            Edit your answer, add the missing detail, and submit again. Nothing
            here counts against you.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link href={`/session/${id}/task`} className="btn btn-primary">
            Back to your task
          </Link>
          <Link href="/home" className="btn btn-ghost">
            My page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="label">
            {bundle.scenario.title} · {bundle.scenario.role}
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Your results</h1>
          <p className="mt-1 text-sm text-muted">
            Submitted {formatter.format(task.submittedAt)} · {task.wordCount} words
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/home" className="btn btn-ghost">
            My page
          </Link>
          <Link href={`/start/${bundle.scenario.slug}`} className="btn btn-primary">
            Try again
          </Link>
        </div>
      </div>

      <section className="panel bg-ink p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-mint">
              Overall
            </p>
            <p className="mt-1 text-2xl font-bold">
              {badge ? `${levelLabels[badge.level as Level]} badge` : "No badge this time"}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {badge
                ? "At least Foundation on every dimension."
                : "A badge needs at least Foundation on every dimension. Your feedback is still yours."}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3 text-sm">
            <p className="font-semibold">
              {badge?.tier ??
                (engine === "llm"
                  ? "AI-assessed · provisional"
                  : "Rule-based · provisional")}
            </p>
            <p className="mt-1 text-white/60">
              Confidence {Math.round(score.confidence * 100)}% · Human-verified: not yet
            </p>
          </div>
        </div>
      </section>

      <p className="rounded-xl border border-line bg-white p-3 text-xs text-muted">
        {engine === "llm"
          ? "AI-assessed and experimental."
          : "Rule-based and experimental."}{" "}
        These scores are about you: teammates do not lower them.{" "}
        {score.summary?.label}
      </p>

      <section className="space-y-3">
        {ordered.map((criterion) => {
          const level = criterion.level as Level;
          const details = criterionDetails.filter(
            (detail) => detail.dimension === criterion.dimension,
          );
          return (
            <article key={criterion.id} className="panel p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold">
                  {dimensionLabels[criterion.dimension as Dimension]}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`chip ${levelStyle[level]}`}>
                    {levelLabels[level]}
                  </span>
                  <span className="text-xs text-muted">
                    {Math.round(criterion.confidence * 100)}% confidence
                  </span>
                </div>
              </div>

              {criterion.quote ? (
                <blockquote className="prose-quote mt-3">
                  “{criterion.quote}”
                  <footer className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-accent-dark">
                    {criterion.verified ? "✓ Verified against your submission" : "Unverified"}
                  </footer>
                </blockquote>
              ) : (
                <p className="mt-3 rounded-lg bg-cream p-3 text-sm text-muted">
                  Insufficient evidence. Nothing in the submission supported a level
                  here.
                </p>
              )}

              <p className="mt-3 text-sm text-muted">{criterion.rationale}</p>

              {details.length > 0 && (
                <details className="mt-3 rounded-lg bg-cream p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-accent-dark">
                    See the {details.length} criteria behind this level
                  </summary>
                  <ul className="mt-3 space-y-3">
                    {details.map((detail) => (
                      <li key={detail.id} className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {detail.id} {detail.name}
                          </span>
                          <span
                            className={`chip text-[11px] ${
                              levelStyle[detail.level as Level]
                            }`}
                          >
                            {levelLabels[detail.level as Level]}
                          </span>
                        </div>
                        {detail.quote && (
                          <p className="mt-1 border-l-2 border-mint pl-2 text-muted">
                            “{detail.quote}”
                            <span className="ml-1 text-[11px] font-semibold text-accent-dark">
                              {detail.verified ? "✓" : "unverified"}
                            </span>
                          </p>
                        )}
                        <p className="mt-1 text-muted">{detail.reason}</p>
                        {detail.counterEvidence && (
                          <p className="mt-1 text-xs text-muted">
                            Also noted: “{detail.counterEvidence}”
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </article>
          );
        })}
      </section>

      {score.summary?.flags && score.summary.flags.length > 0 && (
        <section className="panel border-amber/50 bg-amber-soft p-5">
          <p className="label text-[#7a5305]">Tone flag</p>
          {score.summary.flags.map((flag) => (
            <div key={flag.quote} className="mt-2 text-sm">
              <p className="font-medium">“{flag.quote}”</p>
              <p className="mt-1 text-muted">{flag.note}</p>
            </div>
          ))}
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <p className="label">What you did well</p>
          {score.summary?.strengths?.length ? (
            <ul className="mt-2 space-y-1.5 text-sm">
              {score.summary.strengths.map((dimension) => (
                <li key={dimension} className="flex gap-2">
                  <span className="text-accent">✓</span>
                  {dimensionLabels[dimension as Dimension] ?? dimension}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Nothing reached Foundation this time. That is information, not a
              verdict on you.
            </p>
          )}
        </div>
        <div className="panel p-5">
          <p className="label">Where to improve</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {(score.summary?.improvements ?? []).map((dimension) => (
              <li key={dimension} className="flex gap-2">
                <span className="text-amber">→</span>
                {dimensionLabels[dimension as Dimension] ?? dimension}
              </li>
            ))}
            {!score.summary?.improvements?.length && (
              <li className="text-muted">Everything reached at least Foundation.</li>
            )}
          </ul>
        </div>
      </section>

      {hasFeedback && feedback && (
        <section className="panel p-5">
          <p className="label">Feedback in your own words</p>
          {feedback.strengthQuote && (
            <div className="mt-2">
              <p className="text-sm font-semibold">A strength</p>
              <blockquote className="prose-quote mt-1">
                “{feedback.strengthQuote}”
              </blockquote>
              {feedback.strengthNote && (
                <p className="mt-1 text-sm text-muted">{feedback.strengthNote}</p>
              )}
            </div>
          )}
          {feedback.improvement && (
            <div className="mt-4">
              <p className="text-sm font-semibold">One thing to improve</p>
              <p className="mt-1 text-sm text-muted">{feedback.improvement}</p>
            </div>
          )}
          {feedback.rewrite && (
            <div className="mt-4 rounded-lg border border-mint bg-cream p-3">
              <p className="text-sm font-semibold">A rewrite of your sentence</p>
              <p className="mt-1 text-sm">“{feedback.rewrite}”</p>
              <p className="mt-1 text-xs text-muted">
                Same point, same style. This is one suggestion, not the only
                right answer.
              </p>
            </div>
          )}
        </section>
      )}

      <section className="panel p-5">
        <p className="label">Your next step</p>
        <h2 className="mt-1 text-lg font-bold">{recommendation.title}</h2>
        <dl className="mt-3 space-y-3 text-sm">
          <div>
            <dt className="font-semibold">Drill</dt>
            <dd className="text-muted">{recommendation.drill}</dd>
          </div>
          <div>
            <dt className="font-semibold">Guide</dt>
            <dd className="text-muted">{recommendation.guide}</dd>
          </div>
          <div>
            <dt className="font-semibold">Habit</dt>
            <dd className="text-muted">{recommendation.habit}</dd>
          </div>
          <div>
            <dt className="font-semibold">Practise it</dt>
            <dd className="text-muted">{recommendation.practice}</dd>
          </div>
        </dl>
      </section>

      <section className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="label">Evidence Card</p>
            <h2 className="mt-1 text-lg font-bold">
              {published ? "Your card is public" : "Publish your card"}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              {published
                ? "Anyone with the link can read your levels and quotes. Search engines are asked not to index it."
                : "Publishing shows your username, levels and the quotes above. You can revoke the link at any time."}
            </p>
          </div>
          {published ? (
            <div className="flex gap-2">
              <Link href={`/card/${card.publicSlug}`} className="btn btn-primary">
                Open card
              </Link>
              <form action={revoke}>
                <button type="submit" className="btn btn-ghost">
                  Revoke
                </button>
              </form>
            </div>
          ) : (
            <form action={publish}>
              <button type="submit" className="btn btn-primary">
                Publish card
              </button>
            </form>
          )}
        </div>
        {published && (
          <p className="mt-3 break-all rounded-lg bg-cream p-2 text-xs text-muted">
            /card/{card.publicSlug}
          </p>
        )}
      </section>

      <p className="pb-4 text-center text-xs text-muted">
        {rubricIsStub
          ? `Scored by the provisional rule fallback (${score.rubricVersion}). It reads the task answer only, so the rubric's transcript criteria were not applied. Thresholds are proposals until they are calibrated against human raters.`
          : rubricIsDraft
            ? `Scored against SabiLab rubric v${score.rubricVersion}, which is still a draft. Levels are capped at Proficient and every quote was checked by code. The thresholds have not yet been calibrated against human raters.`
            : `Scored against rubric v${score.rubricVersion}. Levels are capped at Proficient and every quote was checked by code.`}
      </p>
    </div>
  );
}
