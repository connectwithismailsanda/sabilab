"use client";

import { useEffect, useRef, useState } from "react";
import { submitTaskAction } from "@/app/actions/sim";
import { Countdown } from "./Countdown";

export function TaskForm({
  sessionId,
  initialBody,
  endsAt,
  prompt,
  notes,
  error,
}: {
  sessionId: string;
  initialBody: string;
  endsAt: string;
  prompt: string;
  notes: { id: string; label: string; text: string }[];
  error?: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [restored, setRestored] = useState(false);
  const [problem, setProblem] = useState(
    error === "short" ? "Write at least two sentences before submitting." : "",
  );
  const skipFirst = useRef(true);
  const storageKey = `sabilab:draft:${sessionId}`;

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored && stored !== initialBody) {
      setBody(stored);
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }

    window.localStorage.setItem(storageKey, body);
    setSaving(true);

    const id = window.setTimeout(async () => {
      try {
        await fetch(`/api/session/${sessionId}/draft`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        setSavedAt(new Date());
      } catch {
        // The browser copy is still there; the next keystroke tries again.
      } finally {
        setSaving(false);
      }
    }, 1200);

    return () => window.clearTimeout(id);
  }, [body, sessionId, storageKey]);

  const words = body.trim() ? body.trim().split(/\s+/).length : 0;
  const submit = submitTaskAction.bind(null, sessionId);

  return (
    <form
      action={submit}
      onSubmit={(event) => {
        if (body.trim().length < 40) {
          event.preventDefault();
          setProblem("Write at least two sentences before submitting.");
        }
      }}
      className="space-y-4"
    >
      <div className="panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="label">Your individual task</p>
            <p className="mt-2 font-medium">{prompt}</p>
          </div>
          <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <Countdown endsAt={endsAt} warningSeconds={30} label="Due in" />
          </div>
        </div>

        {restored && (
          <p className="mt-3 rounded-lg bg-mint px-3 py-2 text-xs">
            We restored the draft saved in this browser.
          </p>
        )}
        {problem && (
          <p role="alert" className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm">
            {problem}
          </p>
        )}

        <label htmlFor="body" className="sr-only">
          Your recommendation
        </label>
        <textarea
          id="body"
          name="body"
          value={body}
          onChange={(event) => {
            setBody(event.target.value);
            setProblem("");
          }}
          rows={8}
          maxLength={8000}
          className="field mt-4 resize-y"
          placeholder="Write your recommendation in 2 to 4 sentences…"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
          <span>
            {words} {words === 1 ? "word" : "words"}
            {body.length > 0 && body.trim().length < 40
              ? " · write a little more"
              : ""}
          </span>
          <span aria-live="polite">
            {saving
              ? "Saving draft…"
              : savedAt
                ? `Draft saved at ${savedAt.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Drafts save automatically."}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary">
            Submit for feedback
          </button>
          <span className="text-xs text-muted">
            Spelling and typos are not penalised.
          </span>
        </div>
      </div>

      <div className="panel p-4">
        <p className="label">Your notes</p>
        {notes.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No notes yet. You can still answer from the brief and the huddle.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {notes.map((note) => (
              <li key={note.id} className="rounded-lg bg-cream p-3 text-sm">
                <span className="font-semibold">{note.label}: </span>
                {note.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </form>
  );
}
