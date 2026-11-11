import Link from "next/link";
import { notFound } from "next/navigation";
import { startSessionAction } from "@/app/actions/sim";
import { getScenario } from "@/content/scenarios";
import { requireUser } from "@/lib/auth";

export default async function StartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireUser();
  const { slug } = await params;
  const scenario = getScenario(slug);
  if (!scenario) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/home" className="text-sm text-muted hover:text-accent">
          ← My page
        </Link>
        <p className="label mt-4">
          Workplace {scenario.number} · {scenario.role}
        </p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{scenario.title}</h1>
        <p className="mt-2 text-muted">
          {scenario.setting}. {scenario.tagline}
        </p>
      </div>

      <form action={startSessionAction} className="space-y-6">
        <input type="hidden" name="slug" value={scenario.slug} />

        <fieldset className="panel p-5">
          <legend className="px-1 text-lg font-bold">Build your team</legend>
          <p className="mt-1 text-sm text-muted">
            Pick one or two teammates. AI teammates are simulated in this build;
            they will ask questions, disagree and give you facts.
          </p>
          <div className="mt-4 space-y-3">
            {scenario.personas.map((persona, index) => (
              <label
                key={persona.key}
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:border-accent"
              >
                <input
                  type="checkbox"
                  name="teammates"
                  value={persona.key}
                  defaultChecked={index === 0}
                  className="mt-1 h-4 w-4 accent-[#0f6b4f]"
                />
                <span>
                  <span className="font-semibold">{persona.name}</span>
                  <span className="text-muted"> · {persona.role}</span>
                  <span className="block text-sm text-muted">{persona.tone}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">
            You cannot pick more than two. A missing teammate never blocks a
            session.
          </p>
        </fieldset>

        <fieldset className="panel p-5">
          <legend className="px-1 text-lg font-bold">Choose the clock</legend>
          <div className="mt-3 space-y-3">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:border-accent">
              <input
                type="radio"
                name="mode"
                value="demo"
                defaultChecked
                className="mt-1 h-4 w-4 accent-[#0f6b4f]"
              />
              <span>
                <span className="font-semibold">Demo mode</span>
                <span className="block text-sm text-muted">
                  30 second brief · 90 second huddle · 3 minute task
                </span>
              </span>
            </label>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 hover:border-accent">
              <input
                type="radio"
                name="mode"
                value="full"
                className="mt-1 h-4 w-4 accent-[#0f6b4f]"
              />
              <span>
                <span className="font-semibold">Full session</span>
                <span className="block text-sm text-muted">
                  3 minute brief · 15 minute huddle · 5 minute task (23 minutes)
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-primary">
            Take my brief
          </button>
          <Link href="/home" className="btn btn-ghost">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
