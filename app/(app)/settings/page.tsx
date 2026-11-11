import Link from "next/link";
import { deleteAccountAction } from "@/app/actions/auth";
import { requireUser } from "@/lib/auth";
import { DeleteAccount } from "@/components/DeleteAccount";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="label">Settings</p>
        <h1 className="mt-1 text-2xl font-bold">Your account and data</h1>
      </div>

      <section className="panel p-5">
        <h2 className="font-bold">Account</h2>
        <p className="mt-2 text-sm">
          Username: <span className="font-semibold">{user.username}</span>
        </p>
        <p className="mt-1 text-sm text-muted">
          No email, no phone number, no password reset in this prototype. If you
          lose the password, the account cannot be recovered.
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="font-bold">What we keep</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-muted">
          <li>Your username and a hashed password.</li>
          <li>Your simulation sessions, messages, notes and task text.</li>
          <li>Your results, any badge, and any Evidence Card you publish.</li>
        </ul>
        <p className="mt-3 text-sm text-muted">
          Deleting your account removes all of the above, including any published
          card link.
        </p>
      </section>

      <section className="panel border-amber/40 p-5">
        <h2 className="font-bold">Delete my data</h2>
        <p className="mt-1 text-sm text-muted">
          This removes your account and every session, message, note, score, badge
          and card from this server. It cannot be undone.
        </p>
        <div className="mt-4">
          <DeleteAccount action={deleteAccountAction} />
        </div>
      </section>

      <Link href="/home" className="btn btn-ghost">
        ← Back to my page
      </Link>
    </div>
  );
}
