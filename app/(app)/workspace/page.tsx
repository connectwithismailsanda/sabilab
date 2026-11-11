import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getRecentSessions } from "@/lib/session-service";

export default async function WorkspaceIndexPage() {
  const user = await requireUser();
  const sessions = await getRecentSessions(user.id, 10);
  const live = sessions.find((session) => session.state !== "scored");

  if (!live) redirect("/home");

  if (live.state === "task") redirect(`/session/${live.id}/task`);
  if (live.state === "huddle") redirect(`/session/${live.id}/workspace`);
  redirect(`/session/${live.id}/brief`);
}
