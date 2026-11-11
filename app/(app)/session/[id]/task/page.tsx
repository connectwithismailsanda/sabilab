import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TaskForm } from "@/components/TaskForm";
import { getPhase } from "@/lib/clock";
import { requireUser } from "@/lib/auth";
import { getBundle } from "@/lib/session-service";

export const dynamic = "force-dynamic";
// Scoring may call a model; allow a serverless function enough time to answer.
export const maxDuration = 60;

export default async function TaskPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const bundle = await getBundle(user.id, id);
  if (!bundle) notFound();

  const phase = getPhase(bundle.session);
  if (phase === "scored") redirect(`/session/${id}/results`);

  return (
    <div className="space-y-4">
      <Link
        href={phase === "brief" ? `/session/${id}/brief` : `/session/${id}/workspace`}
        className="text-sm text-muted hover:text-accent"
      >
        ← Back to {phase === "brief" ? "the brief" : "the workspace"}
      </Link>

      <div>
        <p className="label">
          {bundle.scenario.title} · {bundle.scenario.role}
        </p>
        <h1 className="mt-1 text-2xl font-bold">Your individual task</h1>
        <p className="mt-1 text-sm text-muted">
          This is your own recommendation. Teammates do not see it and do not lower
          your score.
        </p>
      </div>

      <TaskForm
        sessionId={id}
        initialBody={bundle.task?.body ?? ""}
        endsAt={bundle.session.endsAt.toISOString()}
        prompt={bundle.scenario.taskPrompt}
        notes={bundle.notes}
        error={error}
      />
    </div>
  );
}
