"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  signInAction,
  signUpAction,
  type AuthState,
} from "@/app/actions/auth";

export function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const action = mode === "signup" ? signUpAction : signInAction;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    {},
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-amber/40 bg-amber-soft px-3 py-2 text-sm"
        >
          {state.error}
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[A-Za-z0-9_]{3,20}"
          className="field"
          placeholder="e.g. adaeze_01"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          required
          minLength={8}
          className="field"
        />
      </div>

      {mode === "signup" && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="confirm" className="text-sm font-medium">
              Password again
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="field"
            />
          </div>

          <label className="flex items-start gap-3 rounded-xl bg-mint/60 p-3 text-sm">
            <input
              type="checkbox"
              name="consent"
              required
              className="mt-1 h-4 w-4 accent-[#0f6b4f]"
            />
            <span>
              I agree that SabiLab stores my username and my work for my account,
              and that my task answer may be sent to an AI model provider for
              scoring. I can delete my account and data at any time.
            </span>
          </label>
        </>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending
          ? "One moment…"
          : mode === "signup"
            ? "Create account"
            : "Log in"}
      </button>

      <p className="text-center text-sm text-muted">
        {mode === "signup" ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-accent hover:underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/signup" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
