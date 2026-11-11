"use client";

import { useState } from "react";
import Link from "next/link";
import {
  dimensionLabels,
  getScenario,
  type Dimension,
} from "@/content/scenarios";

type Option = {
  label: string;
  scenario: "adaeze-fabrics" | "funke-kitchen";
  dimension: Dimension;
};

const questions: { prompt: string; options: Option[] }[] = [
  {
    prompt:
      "Cash is tight and a customer asks for a discount. What do you check first?",
    options: [
      {
        label: "What is owed, what is due, and what is really left",
        scenario: "adaeze-fabrics",
        dimension: "role_skill",
      },
      {
        label: "What the customer needs today and what we can still deliver",
        scenario: "funke-kitchen",
        dimension: "communication",
      },
    ],
  },
  {
    prompt: "A deadline moves closer. Your instinct is to…",
    options: [
      {
        label: "Renegotiate the scope before promising anything",
        scenario: "funke-kitchen",
        dimension: "creative_thinking",
      },
      {
        label: "Split the work into stages and protect the first delivery",
        scenario: "funke-kitchen",
        dimension: "leadership",
      },
    ],
  },
  {
    prompt: "A teammate disagrees with you. You…",
    options: [
      {
        label: "Ask for the numbers behind their view",
        scenario: "adaeze-fabrics",
        dimension: "role_skill",
      },
      {
        label: "Test both options against the deadline",
        scenario: "funke-kitchen",
        dimension: "creative_thinking",
      },
    ],
  },
  {
    prompt: "Which work would you choose for a first attempt?",
    options: [
      {
        label: "Reconciling a ledger and finding the missing money",
        scenario: "adaeze-fabrics",
        dimension: "role_skill",
      },
      {
        label: "Running a service under time pressure",
        scenario: "funke-kitchen",
        dimension: "leadership",
      },
    ],
  },
  {
    prompt: "What do you most want to practise?",
    options: [
      {
        label: "Saying the difficult thing clearly",
        scenario: "adaeze-fabrics",
        dimension: "communication",
      },
      {
        label: "Making the call and owning it",
        scenario: "funke-kitchen",
        dimension: "leadership",
      },
      {
        label: "Finding another route when the first is blocked",
        scenario: "funke-kitchen",
        dimension: "creative_thinking",
      },
    ],
  },
];

export function FoundationCheck() {
  const [answers, setAnswers] = useState<(number | null)[]>(
    questions.map(() => null),
  );
  const [submitted, setSubmitted] = useState(false);

  const complete = answers.every((answer) => answer !== null);

  const scenarioCounts: Record<string, number> = {
    "adaeze-fabrics": 0,
    "funke-kitchen": 0,
  };
  const dimensionCounts: Record<string, number> = {};

  if (submitted) {
    questions.forEach((question, index) => {
      const option = question.options[answers[index] ?? 0];
      scenarioCounts[option.scenario] += 1;
      dimensionCounts[option.dimension] =
        (dimensionCounts[option.dimension] ?? 0) + 1;
    });
  }

  const suggestedScenarioSlug =
    (Object.entries(scenarioCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "adaeze-fabrics") as "adaeze-fabrics" | "funke-kitchen";
  const suggestedScenario = getScenario(suggestedScenarioSlug);
  const suggestedDimension =
    (Object.entries(dimensionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ??
      "communication") as Dimension;

  if (submitted && suggestedScenario) {
    return (
      <div className="space-y-4">
        <section className="panel bg-ink p-6 text-white">
          <p className="text-xs uppercase tracking-widest text-mint">
            A suggestion, not a test of ability
          </p>
          <h2 className="mt-2 text-2xl font-bold">
            Start with {suggestedScenario.title}
          </h2>
          <p className="mt-1 text-white/70">
            {suggestedScenario.role} · {suggestedScenario.tagline}
          </p>
          <div className="mt-4 rounded-xl bg-white/10 p-4">
            <p className="text-sm font-semibold">
              Build first: {dimensionLabels[suggestedDimension]}
            </p>
            <p className="mt-1 text-sm text-white/70">
              {suggestedDimension === "role_skill"
                ? "You lean towards the numbers. The next step is making them argue for a decision."
                : suggestedDimension === "communication"
                  ? "You think about the reader. The next step is framing a clear recommendation."
                  : suggestedDimension === "leadership"
                    ? "You are willing to decide. The next step is saying what happens next."
                    : "You look for another route. The next step is comparing the cost of each option."}
            </p>
          </div>
        </section>

        <section className="panel p-5">
          <p className="label">From your answers</p>
          <ul className="mt-2 space-y-2 text-sm">
            {questions.map((question, index) => (
              <li key={question.prompt} className="flex gap-2">
                <span className="text-accent">·</span>
                <span>{question.options[answers[index] ?? 0].label}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/start/${suggestedScenario.slug}`}
            className="btn btn-primary"
          >
            Step into {suggestedScenario.title}
          </Link>
          <Link href="/home" className="btn btn-ghost">
            Back to my page
          </Link>
          <button
            type="button"
            onClick={() => {
              setAnswers(questions.map(() => null));
              setSubmitted(false);
            }}
            className="btn btn-ghost"
          >
            Retake
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-4">
        {questions.map((question, index) => (
          <li key={question.prompt} className="panel p-5">
            <fieldset>
              <legend className="font-semibold">
                {index + 1}. {question.prompt}
              </legend>
              <div className="mt-3 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={option.label}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3 text-sm hover:border-accent"
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === optionIndex}
                      onChange={() => {
                        setAnswers((current) => {
                          const next = [...current];
                          next[index] = optionIndex;
                          return next;
                        });
                      }}
                      className="mt-1 h-4 w-4 accent-[#0f6b4f]"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!complete}
          onClick={() => setSubmitted(true)}
          className="btn btn-primary"
        >
          See my suggestion
        </button>
        <Link href="/home" className="btn btn-ghost">
          Skip for now
        </Link>
        <span className="text-xs text-muted">
          Nothing here is scored or stored.
        </span>
      </div>
    </div>
  );
}
