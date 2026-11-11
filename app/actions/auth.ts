"use server";

import { redirect } from "next/navigation";
import { deleteAccount, requireUser, signIn, signOut, signUp } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export type AuthState = { error?: string };

export async function signUpAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const consent = formData.get("consent");

  if (!consent) {
    return {
      error:
        "Please agree to the data statement before creating an account.",
    };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  const limit = rateLimit(`signup:${username.toLowerCase()}`);
  if (!limit.ok) {
    return { error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` };
  }

  const result = await signUp(username, password);
  if (!result.ok) return { error: result.error };

  redirect("/home");
}

export async function signInAction(
  _previous: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");

  const limit = rateLimit(`login:${username.toLowerCase()}`);
  if (!limit.ok) {
    return { error: `Too many attempts. Try again in ${limit.retryAfterSeconds} seconds.` };
  }

  const result = await signIn(username, password);
  if (!result.ok) return { error: result.error };

  redirect("/home");
}

export async function signOutAction(): Promise<void> {
  await signOut();
  redirect("/");
}

export async function deleteAccountAction(): Promise<void> {
  const user = await requireUser();
  await deleteAccount(user.id);
  redirect("/");
}
