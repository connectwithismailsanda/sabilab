import { notFound, redirect } from "next/navigation";
import { getPhase } from "@/lib/clock";
import { requireUser } from "@/lib/auth";
import { getBundle } from "@/lib/session-service";
import { Workspace } from "@/components/Workspace";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const bundle = await getBundle(user.id, id);
  if (!bundle) notFound();

  const phase = getPhase(bundle.session);
  if (phase === "brief") redirect(`/session/${id}/brief`);
  if (phase === "task") redirect(`/session/${id}/task`);
  if (phase === "scored") redirect(`/session/${id}/results`);

  return (
    <Workspace
      sessionId={id}
      scenario={{
        slug: bundle.scenario.slug,
        title: bundle.scenario.title,
        role: bundle.scenario.role,
        owner: bundle.scenario.owner,
        objects: bundle.scenario.objects,
      }}
      endsAt={bundle.session.endsAt.toISOString()}
      huddleEndsAt={bundle.session.huddleEndsAt.toISOString()}
      twistActive={Boolean(bundle.session.twistFiredAt)}
      studentName={user.username}
      teammates={bundle.teammates.map((teammate) => teammate.name)}
      initialMessages={bundle.messages.map((message) => ({
        id: message.id,
        body: message.body,
        kind: message.kind,
        createdAt: message.createdAt.toISOString(),
        authorName: message.authorName,
        authorKind: message.authorKind,
      }))}
      initialNotes={bundle.notes}
    />
  );
}
