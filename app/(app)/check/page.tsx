import { FoundationCheck } from "@/components/FoundationCheck";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Foundation Check" };

export default async function CheckPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="label">Know yourself</p>
        <h1 className="mt-1 text-2xl font-bold">Foundation Check</h1>
        <p className="mt-1 text-sm text-muted">
          Five questions. We suggest a workplace and one skill to build first.
          This is a suggestion, not a test of ability. You can ignore it.
        </p>
      </div>
      <FoundationCheck />
    </div>
  );
}
