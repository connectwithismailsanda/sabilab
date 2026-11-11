import Link from "next/link";
import { requireUser } from "@/lib/auth";

const skills = [
  {
    title: "Communication",
    body: "Three timed steps with a reactive AI character. Say the difficult thing clearly.",
    status: "Next build",
  },
  {
    title: "Leadership",
    body: "Make a call with incomplete information, then own the consequence.",
    status: "Rule-based in the pilot",
  },
  {
    title: "Creative thinking",
    body: "Find a second route when the first one is blocked.",
    status: "Rule-based in the pilot",
  },
];

export default async function PracticePage() {
  await requireUser();

  return (
    <div className="space-y-5">
      <div>
        <p className="label">Solo practice</p>
        <h1 className="mt-1 text-2xl font-bold">Practise one skill alone</h1>
        <p className="mt-1 text-sm text-muted">
          Short, timed practice you can take any time. Each ends with feedback and a
          badge you can show.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {skills.map((skill) => (
          <article key={skill.title} className="panel flex flex-col p-5">
            <span className="chip self-start bg-cream text-ink-soft">
              {skill.status}
            </span>
            <h2 className="mt-3 text-lg font-bold">{skill.title}</h2>
            <p className="mt-1 flex-1 text-sm text-muted">{skill.body}</p>
            <p className="mt-4 text-xs text-muted">
              Solo simulations are not part of this demo build. The scenarios are
              written and the Communication one is next.
            </p>
          </article>
        ))}
      </div>

      <div className="panel p-5">
        <p className="label">Not in this build</p>
        <p className="mt-2 text-sm text-muted">
          The demo focuses on the team simulation loop: look around, huddle, write,
          get evidence. Solo practice comes next, starting with Communication.
        </p>
        <Link href="/home" className="btn btn-primary mt-4">
          Back to the workplaces
        </Link>
      </div>
    </div>
  );
}
