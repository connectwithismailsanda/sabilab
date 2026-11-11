import { NextResponse } from "next/server";
import { getCurrentUser, type SafeUser } from "@/lib/auth";
import { getSession } from "@/lib/session-service";

export function json(data: unknown, status = 200): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host = request.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function withSession(
  sessionId: string,
): Promise<
  | { ok: true; user: SafeUser }
  | { ok: false; response: NextResponse }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, response: json({ error: "Sign in required." }, 401) };
  }
  const session = await getSession(user.id, sessionId);
  if (!session) {
    return { ok: false, response: json({ error: "Session not found." }, 404) };
  }
  return { ok: true, user };
}
