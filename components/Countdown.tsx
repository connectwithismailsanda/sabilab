"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatClock } from "@/lib/clock";

export function Countdown({
  endsAt,
  className = "",
  warningSeconds = 60,
  onEnd = "refresh",
  label,
}: {
  endsAt: string;
  className?: string;
  warningSeconds?: number;
  onEnd?: "refresh" | "none";
  label?: string;
}) {
  const router = useRouter();
  const fired = useRef(false);
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    fired.current = false;

    function tick() {
      const next = Math.max(
        0,
        Math.floor((new Date(endsAt).getTime() - Date.now()) / 1000),
      );
      setLeft(next);
      if (next <= 0 && !fired.current) {
        fired.current = true;
        if (onEnd === "refresh") router.refresh();
      }
    }

    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [endsAt, onEnd, router]);

  const warning = left <= warningSeconds;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${
        warning ? "text-amber" : ""
      } ${className}`}
      suppressHydrationWarning
      aria-live="off"
    >
      {label && <span className="text-xs font-medium text-muted">{label}</span>}
      {formatClock(left)}
    </span>
  );
}
