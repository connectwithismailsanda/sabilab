import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { enterWorkspaceAction } from "@/app/actions/sim";
import { Countdown } from "@/components/Countdown";
import { getPhase } from "@/lib/clock";
import { requireUser } from "@/lib/auth";
import { getBundle } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const bundle = await getBundle(user.id, id);
  if (!bundle) notFound();

  const phase = getPhase(bundle.session);
  if (phase === "scored") redirect(`/session/${id}/results`);
  if (phase === "task") redirect(`/session/${id}/task`);
  if (phase === "huddle") redirect(`/session/${id}/workspace`);

  const enter = enterWorkspaceAction.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="label">
            Workplace {bundle.scenario.number} · {bundle.scenario.role}
          </p>
          <h1 className="mt-1 text-2xl font-bold">{bundle.scenario.title}</h1>
        </div>
        <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
          <Countdown
            endsAt={bundle.session.briefEndsAt.toISOString()}
            warningSeconds={10}
            label="Brief closes in"
          />
        </div>
      </div>

      <section className="panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">Your private brief</h2>
            <p className="mt-1 text-sm text-muted">
              Only you can see this. Your teammates hold different facts, so you
              will need to talk.
            </p>
          </div>
          <span className="chip">Private</span>
        </div>

        <ul className="mt-4 space-y-2.5">
          {bundle.scenario.brief.facts.map((fact) => (
            <li key={fact} className="flex gap-3 text-sm">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <span>{fact}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 rounded-xl bg-cream p-4">
          <p className="label">Your individual task</p>
          <p className="mt-2 text-sm font-medium">{bundle.scenario.taskPrompt}</p>
        </div>
      </section>

      <section className="panel p-5">
        <p className="label">Your squad</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {bundle.teammates.map((teammate) => (
            <span key={teammate.id} className="chip">
              {teammate.name}
              {teammate.kind === "ai" && " · AI"}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          AI teammates are simulated in this build. Real-person matching is not
          part of the demo.
        </p>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <form action={enter}>
          <button type="submit" className="btn btn-primary">
            Enter the workspace
          </button>
        </form>
        <Link href="/home" className="btn btn-ghost">
          Leave for now
        </Link>
        <span className="text-xs text-muted">
          You can enter early. The clock starts when the huddle opens.
        </span>
      </div>
    </div>
  );
}
