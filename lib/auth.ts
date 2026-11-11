import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { authSessions, users } from "@/lib/db/schema";

const scryptAsync = promisify(scrypt);

const COOKIE_NAME = "sabilab_session";
const SESSION_DAYS = 30;

export type SafeUser = { id: string; username: string };

export function validateUsername(value: string): string | null {
  const username = value.trim();
  if (!/^[A-Za-z0-9_]{3,20}$/.test(username)) {
    return "Use 3 to 20 letters, numbers or underscores.";
  }
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 200) return "That password is too long.";
  return null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const derived = (await scryptAsync(password, salt, expected.length)) as Buffer;
  return timingSafeEqual(expected, derived);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function startSession(userId: string): Promise<void> {
  const { db } = await getDb();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.insert(authSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash: hashToken(token),
    expiresAt,
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const { db } = await getDb();
  const [row] = await db
    .select({ id: users.id, username: users.username })
    .from(authSessions)
    .innerJoin(users, eq(authSessions.userId, users.id))
    .where(
      and(
        eq(authSessions.tokenHash, hashToken(token)),
        gt(authSessions.expiresAt, new Date()),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  return row ?? null;
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function signUp(
  usernameInput: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const username = usernameInput.trim();
  const usernameError = validateUsername(username);
  if (usernameError) return { ok: false, error: usernameError };
  const passwordError = validatePassword(password);
  if (passwordError) return { ok: false, error: passwordError };

  const { db } = await getDb();
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.usernameLower, username.toLowerCase()))
    .limit(1);

  if (existing.length > 0) {
    return { ok: false, error: "That username is already taken." };
  }

  const id = crypto.randomUUID();
  await db.insert(users).values({
    id,
    username,
    usernameLower: username.toLowerCase(),
    passwordHash: await hashPassword(password),
    consentAt: new Date(),
  });

  await startSession(id);
  return { ok: true };
}

export async function signIn(
  usernameInput: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const username = usernameInput.trim().toLowerCase();
  const { db } = await getDb();

  const [user] = await db
    .select({
      id: users.id,
      passwordHash: users.passwordHash,
      deletedAt: users.deletedAt,
    })
    .from(users)
    .where(eq(users.usernameLower, username))
    .limit(1);

  // One generic message, so the form never says which part was wrong.
  const genericError = { ok: false as const, error: "Username or password is incorrect." };

  if (!user || user.deletedAt) return genericError;
  if (!(await verifyPassword(password, user.passwordHash))) return genericError;

  await startSession(user.id);
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    const { db } = await getDb();
    await db.delete(authSessions).where(eq(authSessions.tokenHash, hashToken(token)));
  }
  store.delete(COOKIE_NAME);
}

export async function deleteAccount(userId: string): Promise<void> {
  const { db } = await getDb();
  await db.delete(users).where(eq(users.id, userId));
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
