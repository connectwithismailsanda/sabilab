"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SceneObject } from "@/content/scenarios";
import { formatClock } from "@/lib/clock";
import { Icon } from "./Icons";

type Msg = {
  id: string;
  body: string;
  kind: string;
  createdAt: string;
  authorName: string | null;
  authorKind: string | null;
};

type Note = { id: string; objectId: string; label: string; text: string };

type Props = {
  sessionId: string;
  scenario: {
    slug: string;
    title: string;
    role: string;
    owner: string;
    objects: SceneObject[];
  };
  endsAt: string;
  huddleEndsAt: string;
  twistActive: boolean;
  studentName: string;
  teammates: string[];
  initialMessages: Msg[];
  initialNotes: Note[];
};

function lagosTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(iso));
}

const labelClass: Record<SceneObject["labelPosition"], string> = {
  above:
    "bottom-full left-1/2 mb-1.5 -translate-x-1/2",
  below:
    "top-full left-1/2 mt-1.5 -translate-x-1/2",
  left: "right-full top-1/2 mr-1.5 -translate-y-1/2",
};

export function Workspace({
  sessionId,
  scenario,
  endsAt,
  huddleEndsAt,
  twistActive: initialTwist,
  studentName,
  teammates,
  initialMessages,
  initialNotes,
}: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [twistActive, setTwistActive] = useState(initialTwist);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [tab, setTab] = useState<"chat" | "notes">("chat");
  const [chatOpen, setChatOpen] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [inspect, setInspect] = useState<{
    object: SceneObject;
    saved: boolean;
  } | null>(null);
  const [error, setError] = useState("");
  const [left, setLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(huddleEndsAt).getTime() - Date.now()) / 1000)),
  );

  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const movedRef = useRef(false);

  const notesByObject = new Map(notes.map((note) => [note.objectId, note]));

  function goToTask() {
    if (movedRef.current) return;
    movedRef.current = true;
    router.push(`/session/${sessionId}/task`);
  }

  // The workspace clock. When the huddle ends, move to the task.
  useEffect(() => {
    function tick() {
      const remaining = Math.max(
        0,
        Math.floor((new Date(huddleEndsAt).getTime() - Date.now()) / 1000),
      );
      setLeft(remaining);
      if (remaining <= 0) goToTask();
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [huddleEndsAt]);

  // Poll for the twist and for messages that arrived while the chat was closed.
  useEffect(() => {
    let cancelled = false;

    async function poll() {
      if (sending || typing) return;
      try {
        const response = await fetch(`/api/session/${sessionId}`, {
          cache: "no-store",
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        setMessages(data.messages);
        setNotes(data.notes);
        setTwistActive(data.twistActive);
        if (data.phase === "task") goToTask();
      } catch {
        // A dropped poll is not worth an error message; the next one will catch up.
      }
    }

    const id = window.setInterval(poll, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, sending, typing]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  async function send() {
    const value = text.trim();
    if (!value || sending) return;

    setError("");
    setText("");
    setSending(true);
    setTyping(true);
    const optimistic: Msg = {
      id: `temp-${Date.now()}`,
      body: value,
      kind: "chat",
      createdAt: new Date().toISOString(),
      authorName: studentName,
      authorKind: "student",
    };
    setMessages((previous) => [...previous, optimistic]);

    try {
      const response = await fetch(`/api/session/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "The message did not send.");

      const all = data.all as Msg[];
      const last = all[all.length - 1];
      if (last && last.authorKind === "ai") {
        setMessages(all.slice(0, -1));
        window.setTimeout(() => {
          setMessages(all);
          setTyping(false);
          setSending(false);
        }, 900);
      } else {
        setMessages(all);
        setTyping(false);
        setSending(false);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The message did not send.");
      setMessages((previous) => previous.filter((item) => item.id !== optimistic.id));
      setText(value);
      setTyping(false);
      setSending(false);
    }
  }

  async function inspectObject(object: SceneObject) {
    const existing = notesByObject.get(object.id);
    setInspect({ object, saved: Boolean(existing) });
    if (existing) return;

    try {
      const response = await fetch(`/api/session/${sessionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ objectId: object.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not save that note.");
      setNotes((previous) => [
        ...previous.filter((note) => note.objectId !== object.id),
        { ...data.note, objectId: object.id },
      ]);
      setInspect({ object, saved: true });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that note.");
    }
  }

  function attachNote(note: Note) {
    setText((current) =>
      `${current}${current ? "\n" : ""}[${note.label}] ${note.text}`,
    );
    setTab("chat");
    setAttachOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="label">
            Workplace · {scenario.role}
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">{scenario.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`chip ${
              twistActive ? "bg-amber-soft text-[#7a5305]" : ""
            }`}
          >
            {twistActive ? "Twist active" : "Huddle in progress"}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold tabular-nums ${
              left <= 20
                ? "border-amber bg-amber-soft text-[#7a5305]"
                : "border-line bg-white"
            }`}
            aria-label="Time left in the huddle"
          >
            <Icon name="clock" className="h-4 w-4" />
            {formatClock(left)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_360px]">
        <section className="panel flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <span className="chip">The workplace</span>
            {!chatOpen && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="btn btn-ghost min-h-9 px-3 py-1 text-sm"
              >
                Open chat
              </button>
            )}
          </div>

          {twistActive && (
            <div className="border-b border-amber/40 bg-amber-soft px-4 py-3 text-sm">
              <span className="font-bold text-[#7a5305]">Twist.</span>{" "}
              {scenario.owner} has new information. Read it in the huddle.
            </div>
          )}

          <div className="relative aspect-[2/1] w-full">
            <SceneArt slug={scenario.slug} />
            {scenario.objects.map((object) => {
              const saved = notesByObject.has(object.id);
              return (
                <div
                  key={object.id}
                  className="absolute"
                  style={{ left: `${object.left}%`, top: `${object.top}%` }}
                >
                  <button
                    type="button"
                    onClick={() => inspectObject(object)}
                    className="relative grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/80 bg-white/95 shadow-md transition hover:scale-105 hover:border-accent"
                    aria-label={`Look at ${object.label}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        saved ? "bg-muted/50" : "bg-accent"
                      }`}
                    />
                    <span
                      className={`absolute whitespace-nowrap rounded-md border border-line bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-ink shadow-sm sm:text-xs ${labelClass[object.labelPosition]}`}
                    >
                      {object.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex-1 space-y-3 p-4">
            {inspect ? (
              <div className="rounded-xl bg-mint/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-bold">{inspect.object.title}</h2>
                  <span className="chip bg-white">
                    {inspect.saved ? "Saved to your notes" : "Saving…"}
                  </span>
                </div>
                <p className="mt-2 text-sm">{inspect.object.text}</p>
              </div>
            ) : (
              <p className="text-sm text-muted">
                Select a labelled object to look closer. What you read is saved to
                your notes, ready for your task.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={goToTask}
                className="btn btn-primary"
              >
                Go to my task
                <Icon name="arrow" className="h-4 w-4" />
              </button>
              <span className="text-xs text-muted">
                {notes.length} {notes.length === 1 ? "note" : "notes"} collected ·
                Inspections are not scored
              </span>
            </div>
          </div>
        </section>

        {chatOpen && (
          <section className="panel flex min-h-[460px] flex-col overflow-hidden max-h-[75vh] min-[900px]:sticky min-[900px]:top-20 min-[900px]:h-[calc(100dvh-7.5rem)] min-[900px]:max-h-none">
            <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
              <h2 className="text-sm font-bold">Squad huddle</h2>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream"
                aria-label="Collapse chat"
              >
                <Icon name="close" className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1 border-b border-line px-2 py-1.5">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "chat"}
                onClick={() => setTab("chat")}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === "chat"
                    ? "bg-mint font-semibold text-accent-dark"
                    : "text-muted hover:bg-cream"
                }`}
              >
                Chat
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === "notes"}
                onClick={() => setTab("notes")}
                className={`rounded-lg px-3 py-1.5 text-sm ${
                  tab === "notes"
                    ? "bg-mint font-semibold text-accent-dark"
                    : "text-muted hover:bg-cream"
                }`}
              >
                Notes ({notes.length})
              </button>
            </div>

            {tab === "chat" ? (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {teammates.map((name) => (
                      <span key={name} className="chip bg-cream text-ink-soft">
                        {name}
                      </span>
                    ))}
                  </div>

                  {messages.map((message) => {
                    if (message.kind === "twist") {
                      return (
                        <div
                          key={message.id}
                          className="rounded-xl border border-amber/50 bg-amber-soft p-3 text-sm"
                        >
                          <p className="label text-[#7a5305]">
                            Twist · {message.authorName ?? scenario.owner}
                          </p>
                          <p className="mt-1">{message.body}</p>
                        </div>
                      );
                    }

                    const mine = message.authorKind === "student";
                    return (
                      <div
                        key={message.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                            mine
                              ? "bg-accent text-white"
                              : "border border-line bg-cream"
                          }`}
                        >
                          {!mine && (
                            <p className="text-[11px] font-semibold text-accent-dark">
                              {message.authorName ?? "Teammate"}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap">{message.body}</p>
                          <p
                            className={`mt-1 text-[10px] ${
                              mine ? "text-white/60" : "text-muted"
                            }`}
                            suppressHydrationWarning
                          >
                            {lagosTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="flex items-center gap-2 text-xs text-muted">
                      <span className="font-semibold text-accent-dark">
                        {teammates[0] ?? "Teammate"}
                      </span>
                      <span className="inline-flex gap-1" aria-label="is typing">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:120ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted [animation-delay:240ms]" />
                      </span>
                    </div>
                  )}

                  {error && (
                    <p role="alert" className="rounded-lg bg-amber-soft p-2 text-xs">
                      {error}
                    </p>
                  )}
                  <div ref={endRef} />
                </div>

                <div className="border-t border-line p-2.5">
                  {attachOpen && (
                    <div className="mb-2 max-h-48 overflow-y-auto rounded-xl border border-line bg-white p-2">
                      {notes.length === 0 ? (
                        <p className="p-2 text-xs text-muted">
                          No notes yet. Select an object in the scene first.
                        </p>
                      ) : (
                        notes.map((note) => (
                          <button
                            key={note.id}
                            type="button"
                            onClick={() => attachNote(note)}
                            className="block w-full rounded-lg px-2 py-1.5 text-left text-xs hover:bg-mint"
                          >
                            <span className="font-semibold">{note.label}</span>
                            <span className="block truncate text-muted">
                              {note.text}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  <textarea
                    ref={inputRef}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder="Ask your team, or share what you found…"
                    className="field resize-none text-sm"
                    aria-label="Message your team"
                  />

                  <div className="mt-1.5 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setAttachOpen((open) => !open)}
                      className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream"
                      aria-label="Attach a note"
                      aria-expanded={attachOpen}
                    >
                      <Icon name="paperclip" className="h-4 w-4" />
                    </button>
                    <span className="text-[11px] text-muted">
                      Messages are saved as you send.
                    </span>
                    <button
                      type="button"
                      onClick={() => void send()}
                      disabled={sending || !text.trim()}
                      className="btn btn-primary ml-auto min-h-10 px-3 py-1.5 text-sm"
                    >
                      <Icon name="send" className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {notes.length === 0 ? (
                  <p className="text-sm text-muted">
                    Objects you inspect are saved here, ready to attach to a
                    message or use in your task.
                  </p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="rounded-xl border border-line p-3">
                      <p className="text-xs font-bold text-accent-dark">
                        {note.label}
                      </p>
                      <p className="mt-1 text-sm">{note.text}</p>
                      <button
                        type="button"
                        onClick={() => attachNote(note)}
                        className="mt-2 text-xs font-semibold text-accent hover:underline"
                      >
                        Attach to a message
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>
        )}
      </div>

      <p className="text-xs text-muted">
        Your task is due at{" "}
        {new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Africa/Lagos",
        }).format(new Date(endsAt))}
        . Your notes stay with you.
      </p>
    </div>
  );
}

function SceneArt({ slug }: { slug: string }) {
  const kitchen = slug === "funke-kitchen";

  return (
    <svg
      viewBox="0 0 800 400"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`sky-${slug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kitchen ? "#dcefe4" : "#f7ead6"} />
          <stop offset="100%" stopColor={kitchen ? "#f4efe2" : "#efe0c8"} />
        </linearGradient>
        <linearGradient id={`floor-${slug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={kitchen ? "#c9b89a" : "#b98d5f"} />
          <stop offset="100%" stopColor={kitchen ? "#b8a382" : "#9c7146"} />
        </linearGradient>
      </defs>

      <rect width="800" height="400" fill={`url(#sky-${slug})`} />
      <rect y="300" width="800" height="100" fill={`url(#floor-${slug})`} />
      <rect x="560" y="40" width="190" height="150" rx="8" fill="#cfe8f5" opacity="0.8" />
      <rect x="560" y="40" width="190" height="150" rx="8" fill="none" stroke="#8ba9b5" strokeWidth="4" />

      {kitchen ? (
        <>
          <rect x="70" y="60" width="170" height="100" rx="6" fill="#e8dcc4" stroke="#b9a98b" strokeWidth="4" />
          <rect x="85" y="75" width="60" height="30" fill="#fff8e7" />
          <rect x="155" y="75" width="70" height="30" fill="#fff8e7" />
          <rect x="85" y="115" width="90" height="30" fill="#fff8e7" />
          <circle cx="400" cy="85" r="30" fill="#fff8e7" stroke="#8a7a5c" strokeWidth="5" />
          <line x1="400" y1="85" x2="400" y2="65" stroke="#5b5240" strokeWidth="4" />
          <line x1="400" y1="85" x2="414" y2="92" stroke="#5b5240" strokeWidth="4" />
          <rect x="300" y="235" width="180" height="70" rx="8" fill="#7f8b83" />
          <circle cx="345" cy="228" r="24" fill="#d9d2c3" stroke="#8a8375" strokeWidth="4" />
          <circle cx="405" cy="230" r="20" fill="#cfc7b7" stroke="#8a8375" strokeWidth="4" />
          <path d="M330 205 q15 -18 0 -34" stroke="#cfd8d2" strokeWidth="5" fill="none" />
          <rect x="500" y="250" width="52" height="80" rx="12" fill="#c4583f" />
          <rect x="512" y="238" width="28" height="16" rx="4" fill="#8d3c2b" />
          <rect x="560" y="250" width="200" height="16" rx="4" fill="#a8763f" />
          <rect x="580" y="266" width="26" height="18" fill="#fff8e7" />
          <rect x="614" y="266" width="26" height="18" fill="#fff8e7" />
          <rect x="648" y="266" width="26" height="18" fill="#fff8e7" />
          <rect x="682" y="266" width="26" height="18" fill="#fff8e7" />
          <rect x="716" y="266" width="26" height="18" fill="#fff8e7" />
        </>
      ) : (
        <>
          <rect x="70" y="85" width="260" height="190" rx="6" fill="#a97a4c" stroke="#7c5733" strokeWidth="5" />
          {[115, 165, 215].map((y) => (
            <line key={y} x1="80" y1={y} x2="320" y2={y} stroke="#7c5733" strokeWidth="5" />
          ))}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
            <rect
              key={index}
              x={92 + index * 25}
              y={index % 2 === 0 ? 78 : 130}
              width="16"
              height="38"
              rx="4"
              fill={["#2f6f8f", "#3f8f7a", "#c98f3d", "#8f5c9e"][index % 4]}
            />
          ))}
          <rect x="350" y="65" width="150" height="95" rx="5" fill="#d9c3a5" stroke="#a8906d" strokeWidth="4" />
          <rect x="368" y="80" width="45" height="55" fill="#fffdf5" />
          <rect x="424" y="80" width="55" height="38" fill="#fffdf5" />
          <rect x="330" y="250" width="390" height="90" rx="6" fill="#8a5a35" />
          <rect x="320" y="242" width="410" height="16" rx="4" fill="#a8763f" />
          <rect x="430" y="216" width="70" height="28" rx="3" fill="#1f5c46" />
          <rect x="470" y="222" width="20" height="16" fill="#e9e1cd" />
          <rect x="540" y="216" width="42" height="28" rx="5" fill="#2c2c2c" />
          <rect x="548" y="208" width="26" height="10" rx="3" fill="#4b4b4b" />
          <circle cx="680" cy="200" r="16" fill="#e3b23c" opacity="0.7" />
        </>
      )}

      <rect width="800" height="400" fill="none" stroke="#00000010" strokeWidth="2" />
    </svg>
  );
}
