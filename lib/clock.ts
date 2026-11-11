import type { SimSession } from "@/lib/db/schema";

export type Phase = "brief" | "huddle" | "task" | "scored";

/** The server owns the clock. The client only renders what this returns. */
export function getPhase(session: SimSession, now: Date = new Date()): Phase {
  if (session.state === "scored") return "scored";
  if (session.state === "task") return "task";
  if (session.state === "huddle") {
    return now >= session.huddleEndsAt ? "task" : "huddle";
  }
  if (now >= session.huddleEndsAt) return "task";
  if (now >= session.briefEndsAt) return "huddle";
  return "brief";
}

export function secondsLeft(target: Date | string, now: Date = new Date()): number {
  const end = typeof target === "string" ? new Date(target) : target;
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function phaseEnd(
  session: SimSession,
  phase: Phase,
): Date {
  switch (phase) {
    case "brief":
      return session.briefEndsAt;
    case "huddle":
      return session.huddleEndsAt;
    case "task":
      return session.endsAt;
    default:
      return session.endsAt;
  }
}
