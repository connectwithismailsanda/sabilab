import { NextResponse } from "next/server";
import { getPhase } from "@/lib/clock";
import { getCurrentUser } from "@/lib/auth";
import { getBundle } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const bundle = await getBundle(user.id, id);
  if (!bundle) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const phase = getPhase(bundle.session);

  return NextResponse.json(
    {
      phase,
      endsAt: bundle.session.endsAt,
      briefEndsAt: bundle.session.briefEndsAt,
      huddleEndsAt: bundle.session.huddleEndsAt,
      twistAt: bundle.session.twistAt,
      twistActive: Boolean(bundle.session.twistFiredAt),
      messages: bundle.messages,
      notes: bundle.notes,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
