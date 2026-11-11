import { json, sameOrigin, withSession } from "@/lib/http";
import { saveDraft } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  if (!sameOrigin(request)) return json({ error: "Bad origin." }, 403);

  const { id } = await params;
  const gate = await withSession(id);
  if (!gate.ok) return gate.response;

  let payload: { body?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const body = typeof payload.body === "string" ? payload.body.slice(0, 8000) : "";
  await saveDraft({ sessionId: id, userId: gate.user.id, body });
  return json({ saved: true, at: new Date().toISOString() });
}
