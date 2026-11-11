import { recordEvent } from "@/lib/analytics";
import { json, sameOrigin, withSession } from "@/lib/http";
import { saveNote } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "Bad origin." }, 403);

  const { id } = await params;
  const gate = await withSession(id);
  if (!gate.ok) return gate.response;

  let payload: { objectId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const objectId = typeof payload.objectId === "string" ? payload.objectId : "";
  if (!objectId) return json({ error: "No object selected." }, 400);

  const note = await saveNote({ sessionId: id, objectId });
  if (!note) return json({ error: "Object not found." }, 404);

  await recordEvent("object_inspected", {
    sessionId: id,
    userId: gate.user.id,
    payload: { objectId },
  });

  return json({ note });
}
