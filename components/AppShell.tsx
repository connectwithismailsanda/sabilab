"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Icon } from "./Icons";

const nav = [
  { href: "/home", label: "Home", icon: "home" as const },
  { href: "/workspace", label: "Workspace", icon: "workspace" as const },
  { href: "/check", label: "Check", icon: "check" as const },
  { href: "/practice", label: "Practice", icon: "practice" as const },
  { href: "/home#activity", label: "History", icon: "history" as const },
  { href: "/settings", label: "Settings", icon: "settings" as const },
];

function contextFor(pathname: string): string {
  if (pathname.startsWith("/session/")) return "Simulation";
  if (pathname.startsWith("/start/")) return "Team setup";
  if (pathname.startsWith("/home")) return "My page";
  if (pathname.startsWith("/check")) return "Foundation Check";
  if (pathname.startsWith("/practice")) return "Solo practice";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/workspace")) return "Workspace";
  return "SabiLab";
}

export function AppShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [helpOpen, setHelpOpen] = useState(false);
  const helpButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!helpOpen) return;
    closeButton.current?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setHelpOpen(false);
        helpButton.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [helpOpen]);

  return (
    <div className="min-h-dvh md:flex bg-white text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>

      <aside className="hidden border-r border-line bg-white md:flex md:w-56 md:shrink-0 md:flex-col">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-14 items-center px-5">
            <Link href="/home" className="font-display font-extrabold text-lg tracking-tighter">
              Sabi<em className="text-[#6d28d9]">Lab</em>
            </Link>
          </div>
          <nav aria-label="Main" className="flex-1 space-y-1 px-3 py-3">
            {nav.map((item) => {
              const active =
                item.href === "/home"
                  ? pathname === "/home"
                  : pathname.startsWith(item.href.replace("#activity", ""));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm ${
                    active
                      ? "bg-[#F5F0FF] font-semibold text-[#6d28d9]"
                      : "text-[#756b86] hover:bg-[#F5F0FF]"
                  }`}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <p className="px-5 py-4 text-xs text-[#756b86]">
            Prototype build 0.1
            <br />
            Scripted replies, evidence-bound scoring.
          </p>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-md">
          <div className="flex h-14 items-center gap-2 px-4">
            <Link href="/home" className="font-display font-extrabold text-base tracking-tighter md:hidden">
              Sabi<em className="text-[#6d28d9]">Lab</em>
            </Link>
            <span className="hidden text-xs text-[#756b86] font-bold md:inline uppercase tracking-wider">
              {contextFor(pathname)}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <details className="relative">
                <summary
                  className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full hover:bg-[#F5F0FF] [&::-webkit-details-marker]:hidden"
                  aria-label="Notifications"
                >
                  <Icon name="bell" />
                </summary>
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-[#e9e0f7] bg-white p-4 text-sm text-ink shadow-[0_24px_70px_#30105c1a]">
                  <p className="font-bold">Notifications</p>
                  <p className="mt-1 text-[#756b86]">You are all caught up.</p>
                </div>
              </details>

              <button
                ref={helpButton}
                type="button"
                onClick={() => setHelpOpen(true)}
                className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F5F0FF]"
                aria-label="Help"
              >
                <Icon name="help" />
              </button>

              <details className="relative">
                <summary
                  className="grid h-9 w-9 cursor-pointer list-none place-items-center rounded-full bg-[#F5F0FF] text-[#6d28d9] text-xs font-black uppercase [&::-webkit-details-marker]:hidden"
                  aria-label={`Account menu for ${username}`}
                >
                  {username.slice(0, 1).toUpperCase()}
                </summary>
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#e9e0f7] bg-white p-2 text-sm text-ink shadow-[0_24px_70px_#30105c1a]">
                  <p className="px-3 py-2 text-xs text-[#756b86]">
                    Signed in as {username}
                  </p>
                  <Link href="/home" className="block rounded-lg px-3 py-2 hover:bg-[#F5F0FF]">
                    My page
                  </Link>
                  <Link
                    href="/home#activity"
                    className="block rounded-lg px-3 py-2 hover:bg-[#F5F0FF]"
                  >
                    Activity history
                  </Link>
                  <Link
                    href="/settings"
                    className="block rounded-lg px-3 py-2 hover:bg-[#F5F0FF]"
                  >
                    Delete my data
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-lg px-3 py-2 text-left hover:bg-[#F5F0FF]"
                    >
                      Log out
                    </button>
                  </form>
                </div>
              </details>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-10">
          {children}
        </main>
      </div>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-[#e9e0f7] bg-white md:hidden"
      >
        {nav.map((item) => {
          const active =
            item.href === "/home"
              ? pathname === "/home"
              : pathname.startsWith(item.href.replace("#activity", ""));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? "text-[#6d28d9]" : "text-[#756b86]"
              }`}
            >
              <Icon name={item.icon} className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {helpOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#16052dcc] p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setHelpOpen(false);
              helpButton.current?.focus();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            className="w-full max-w-md rounded-[22px] bg-white p-6 shadow-[0_30px_90px_#10021e88]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="help-title" className="font-display font-extrabold text-lg Syne">
                How the workspace works
              </h2>
              <button
                ref={closeButton}
                type="button"
                onClick={() => {
                  setHelpOpen(false);
                  helpButton.current?.focus();
                }}
                className="grid h-9 w-9 place-items-center rounded-full hover:bg-[#F5F0FF]"
                aria-label="Close help"
              >
                <Icon name="close" />
              </button>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[#756b86]">
              <li>
                <strong className="text-ink">Look around.</strong> Select a
                labelled object to read what is on it. It is saved to your
                notes.
              </li>
              <li>
                <strong className="text-ink">Talk with your team.</strong> Ask
                questions, share what you found, and decide together.
              </li>
              <li>
                <strong className="text-ink">Write your task.</strong> Your own
                recommendation, using your notes.
              </li>
              <li>
                <strong className="text-ink">Get feedback.</strong> Scores that
                quote your own words.
              </li>
            </ul>
            <p className="mt-4 rounded-xl bg-[#F5F0FF] p-3 text-xs text-[#756b86]">
              Prototype: replies are scripted and scoring is rule-based. Nothing
              is sent to an employer unless you publish a card.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
