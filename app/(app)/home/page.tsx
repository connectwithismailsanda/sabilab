import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { scenarios } from "@/content/scenarios";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { badges } from "@/lib/db/schema";
import { getRecentSessions } from "@/lib/session-service";

const stateLabel: Record<string, string> = {
  brief: "Not started",
  huddle: "In progress",
  task: "Your task",
  scored: "Scored",
};

function nextHref(id: string, state: string): string {
  if (state === "scored") return `/session/${id}/results`;
  if (state === "task") return `/session/${id}/task`;
  if (state === "huddle") return `/session/${id}/workspace`;
  return `/session/${id}/brief`;
}

export default async function HomePage() {
  const user = await requireUser();
  const sessions = await getRecentSessions(user.id);
  const { db } = await getDb();

  const badgeRows =
    sessions.length > 0
      ? await db
          .select({ sessionId: badges.sessionId, level: badges.level })
          .from(badges)
          .where(
            and(
              eq(badges.userId, user.id),
              inArray(
                badges.sessionId,
                sessions.map((session) => session.id),
              ),
            ),
          )
      : [];

  const badgeBySession = new Map(
    badgeRows.map((badge) => [badge.sessionId, badge.level]),
  );

  const formatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="label">My page</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Hello, {user.username}.
        </h1>
        <p className="mt-1 text-muted">
          Pick a workplace, or continue where you stopped.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Link
          href="/check"
          className="panel flex flex-col justify-between bg-ink p-5 text-white transition hover:border-accent"
        >
          <div>
            <span className="chip bg-white/10 text-mint">Know yourself</span>
            <h2 className="mt-3 text-lg font-bold">Foundation Check</h2>
            <p className="mt-1 text-sm text-white/70">
              Five questions suggest a workplace and a skill to build first.
            </p>
          </div>
          <span className="mt-4 text-sm font-semibold text-mint">
            Take the check →
          </span>
        </Link>

        <div className="panel flex flex-col justify-between p-5">
          <div>
            <span className="chip">Solo practice</span>
            <h2 className="mt-3 text-lg font-bold">Practise one skill alone</h2>
            <p className="mt-1 text-sm text-muted">
              Communication, leadership and creative thinking. Short and timed.
            </p>
          </div>
          <Link href="/practice" className="mt-4 text-sm font-semibold text-accent">
            Open solo practice →
          </Link>
        </div>

        <div className="panel flex flex-col justify-between p-5">
          <div>
            <span className="chip">Your data</span>
            <h2 className="mt-3 text-lg font-bold">Kept on this server</h2>
            <p className="mt-1 text-sm text-muted">
              A username and your work. In this prototype it stays on this
              machine. You can delete it at any time.
            </p>
          </div>
          <Link href="/settings" className="mt-4 text-sm font-semibold text-accent">
            Data controls →
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="label">Choose a workplace</p>
            <h2 className="mt-1 text-xl font-bold">Where do you want to work?</h2>
          </div>
          <span className="hidden text-xs text-muted sm:block">
            Demo mode takes about 5 minutes
          </span>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {scenarios.map((scenario) => (
            <article key={scenario.slug} className="panel flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-accent">
                    Workplace {scenario.number} · {scenario.role}
                  </span>
                  <h3 className="mt-1 text-lg font-bold">{scenario.title}</h3>
                </div>
                {scenario.status === "beta" && (
                  <span className="chip bg-amber-soft text-[#7a5305]">Beta</span>
                )}
              </div>
              <p className="mt-1 flex-1 text-sm text-muted">{scenario.tagline}</p>
              <Link
                href={`/start/${scenario.slug}`}
                className="btn btn-primary mt-4 self-start"
              >
                Start a session
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section id="activity" className="scroll-mt-20">
        <p className="label">Your activity</p>
        <h2 className="mt-1 text-xl font-bold">Attempts and results</h2>

        {sessions.length === 0 ? (
          <p className="panel mt-4 p-5 text-sm text-muted">
            Nothing here yet. Your sessions will appear with their date, levels and
            any badge. Change since the last attempt arrives with the pilot.
          </p>
        ) : (
          <ul className="panel mt-4 divide-y divide-line">
            {sessions.map((session) => {
              const scenario = scenarios.find(
                (item) => item.slug === session.scenarioSlug,
              );
              const badge = badgeBySession.get(session.id);
              return (
                <li
                  key={session.id}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      {scenario?.title ?? session.scenarioSlug}
                    </p>
                    <p className="text-xs text-muted">
                      {formatter.format(session.createdAt)} ·{" "}
                      {session.mode === "demo" ? "Demo" : "Full session"} ·{" "}
                      {stateLabel[session.state] ?? session.state}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {badge && (
                      <span className="chip">{badge} badge</span>
                    )}
                    <Link
                      href={nextHref(session.id, session.state)}
                      className="btn btn-ghost"
                    >
                      {session.state === "scored" ? "View results" : "Continue"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
