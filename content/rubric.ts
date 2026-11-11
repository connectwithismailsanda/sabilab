import type { Dimension, Level } from "@/content/scenarios";

/**
 * SabiLab AI Scoring Prompt and Rubric, draft v0.2 (8 November 2026).
 *
 * This is the real rubric supplied by the product owner. It is still a draft:
 * every rule and threshold is a starting proposal until calibrated against
 * human raters. The code enforces the hard rules; it does not make the
 * thresholds trustworthy.
 *
 * Role skill is authored for Accounts (Adaeze's Fabrics). Funke's Kitchen is a
 * beta scenario and uses the same A1 and A3, with A2 adapted to operations.
 */

export type CriterionId =
  | "C1"
  | "C2"
  | "C3"
  | "C4"
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "R1"
  | "R2"
  | "R3"
  | "R4"
  | "A1"
  | "A2"
  | "A3";

export type CriterionLevels = {
  needs_practice: string;
  foundation: string;
  proficient: string;
};

export type Criterion = {
  id: CriterionId;
  dimension: Dimension;
  name: string;
  levels: CriterionLevels;
};

export type Rubric = {
  version: string;
  status: "draft" | "calibrated";
  source: string;
  maxLevel: Level;
  dimensions: { dimension: Dimension; name: string }[];
  criteria: Criterion[];
  rules: {
    dimensionLevel: "second-lowest";
    insufficientMajority: "more-than-half";
    quoteMustBeExact: boolean;
    quoteMustCiteStudentMessage: boolean;
    spellingGrammarNotScored: boolean;
    numbersCheckedByCode: boolean;
    toneAffectsOnly: CriterionId;
    maxClarifyingQuestions: number;
    language: string;
  };
  tone: {
    positiveMarkers: string[];
    concernFlags: string[];
    notFlags: string[];
  };
};

export const rubric: Rubric = {
  version: "0.2",
  status: "draft",
  source:
    "SabiLab: AI Scoring Prompt and Rubric, draft v0.2, 8 November 2026.",
  maxLevel: "proficient",
  dimensions: [
    { dimension: "communication", name: "Communication" },
    { dimension: "leadership", name: "Leadership" },
    { dimension: "creative_thinking", name: "Creative thinking" },
    { dimension: "role_skill", name: "Role skill" },
  ],
  criteria: [
    {
      id: "C1",
      dimension: "communication",
      name: "Clarity",
      levels: {
        needs_practice: "Recipient would have to guess who, what or when.",
        foundation:
          "Main request is clear; one detail is missing, often the time or the owner.",
        proficient:
          "Recipient can act at once: what, who, by when, and why if it matters.",
      },
    },
    {
      id: "C2",
      dimension: "communication",
      name: "Audience fit",
      levels: {
        needs_practice:
          "Same message whoever reads it, or too long or thin for the reader.",
        foundation: "Some adaptation, such as shorter for the boss.",
        proficient:
          "Content, length and register clearly suit this reader.",
      },
    },
    {
      id: "C3",
      dimension: "communication",
      name: "Professional tone",
      levels: {
        needs_practice:
          "Dismissive, blaming, mocking or hostile, or ignores an upset customer's feelings.",
        foundation:
          "Courteous and neutral, with little acknowledgement or direction.",
        proficient:
          "Acknowledges feelings, owns what is theirs, and keeps the relationship while staying firm on facts.",
      },
    },
    {
      id: "C4",
      dimension: "communication",
      name: "Active understanding",
      levels: {
        needs_practice:
          "Assumes facts and asks nothing even when information is missing.",
        foundation:
          "Asks at least one relevant question or confirms a fact.",
        proficient:
          "Asks targeted questions that change the plan and checks understanding before acting.",
      },
    },
    {
      id: "L1",
      dimension: "leadership",
      name: "Delegation",
      levels: {
        needs_practice: "No named owners or no deadlines.",
        foundation: "Owners named for most tasks, deadlines partly.",
        proficient:
          "Every task has an owner and a deadline that fits the budget and time limit.",
      },
    },
    {
      id: "L2",
      dimension: "leadership",
      name: "Decisions with reasons",
      levels: {
        needs_practice: "No decision, or a decision with no reason.",
        foundation: "Decision with one reason.",
        proficient: "Decision weighs a trade-off and says why.",
      },
    },
    {
      id: "L3",
      dimension: "leadership",
      name: "Support for others",
      levels: {
        needs_practice: "Ignores or dismisses a struggling teammate.",
        foundation: "Acknowledges and offers general help.",
        proficient:
          "Acknowledges, changes the plan concretely (reassign, extend, share), and plans a check-in.",
      },
    },
    {
      id: "L4",
      dimension: "leadership",
      name: "Ownership",
      levels: {
        needs_practice: "Blames others or circumstances.",
        foundation: "Accepts responsibility in general terms.",
        proficient:
          "Names their own decision, what went wrong, and a specific change for next time.",
      },
    },
    {
      id: "R1",
      dimension: "creative_thinking",
      name: "Problem framing",
      levels: {
        needs_practice: "Restates symptoms or jumps to a solution.",
        foundation:
          "States a problem, partly tied to what they learned.",
        proficient:
          "Frames a specific problem for a specific person, grounded in interview evidence.",
      },
    },
    {
      id: "R2",
      dimension: "creative_thinking",
      name: "Options",
      levels: {
        needs_practice: "One idea only.",
        foundation: "Two similar ideas.",
        proficient:
          "Two or more clearly different options, with a choice and a reason, within the constraints.",
      },
    },
    {
      id: "R3",
      dimension: "creative_thinking",
      name: "Use of evidence and constraints",
      levels: {
        needs_practice: "Ignores what they learned.",
        foundation: "Uses one fact.",
        proficient: "Uses several facts and respects stated constraints.",
      },
    },
    {
      id: "R4",
      dimension: "creative_thinking",
      name: "Iteration",
      levels: {
        needs_practice: "Defends the original idea unchanged.",
        foundation: "Makes a small change.",
        proficient:
          "Changes the idea in response to the specific feedback and says what they learned.",
      },
    },
    {
      id: "A1",
      dimension: "role_skill",
      name: "Accuracy",
      levels: {
        needs_practice: "Key figures missing or wrong.",
        foundation: "Key figures stated correctly.",
        proficient: "Figures and their implication both correct.",
      },
    },
    {
      id: "A2",
      dimension: "role_skill",
      name: "Prioritisation",
      levels: {
        needs_practice: "Pays or discounts without looking at cash.",
        foundation: "Weighs cash or the customer, not both.",
        proficient:
          "Weighs both, with numbers, and proposes a path.",
      },
    },
    {
      id: "A3",
      dimension: "role_skill",
      name: "Reasoned recommendation",
      levels: {
        needs_practice: "No reason given.",
        foundation: "Reason without numbers.",
        proficient: "Reason with correct numbers.",
      },
    },
  ],
  rules: {
    dimensionLevel: "second-lowest",
    insufficientMajority: "more-than-half",
    quoteMustBeExact: true,
    quoteMustCiteStudentMessage: true,
    spellingGrammarNotScored: true,
    numbersCheckedByCode: true,
    toneAffectsOnly: "C3",
    maxClarifyingQuestions: 2,
    language:
      "English only in version 1. Nigerian English is accepted. Ask once for a restatement before scoring.",
  },
  tone: {
    positiveMarkers: [
      "acknowledges feelings",
      "takes ownership",
      "gives a specific next step",
      "polite request",
      "offers help",
      "thanks",
    ],
    concernFlags: [
      "dismissive",
      "blames others",
      "insulting or mocking",
      "sarcastic toward a customer",
      "hostile or threatening",
      "profanity",
      "pressuring",
      "ignores an upset person's concern",
      "register mismatch for the audience",
    ],
    notFlags: [
      "bluntness that stays respectful",
      "honorifics such as Sir or Ma",
      "warm humour",
      "short messages",
      "typos",
      "Nigerian English usage",
    ],
  },
};

/** Funke's Kitchen is beta; A2 is adapted from cash to operations. */
const funkeA2: CriterionLevels = {
  needs_practice: "Delivers or refunds without looking at the constraint.",
  foundation: "Weighs the shortfall or the customer, not both.",
  proficient:
    "Weighs both, with numbers, and proposes a path such as split, outsource or credit.",
};

export function criteriaForScenario(slug: string): Criterion[] {
  if (slug !== "funke-kitchen") return rubric.criteria;
  return rubric.criteria.map((criterion) =>
    criterion.id === "A2"
      ? { ...criterion, levels: funkeA2 }
      : criterion,
  );
}

export function criteriaForDimension(
  dimension: Dimension,
  slug: string,
): Criterion[] {
  return criteriaForScenario(slug).filter(
    (criterion) => criterion.dimension === dimension,
  );
}

export function criterionName(id: string, slug: string): string {
  const criterion = criteriaForScenario(slug).find((item) => item.id === id);
  return criterion ? `${criterion.id} ${criterion.name}` : id;
}

export function rubricForPrompt(slug: string): string {
  return rubric.dimensions
    .map((dimension) => {
      const criteria = criteriaForDimension(dimension.dimension, slug)
        .map(
          (criterion) =>
            `- ${criterion.id} ${criterion.name}\n` +
            `  Needs practice: ${criterion.levels.needs_practice}\n` +
            `  Foundation: ${criterion.levels.foundation}\n` +
            `  Proficient: ${criterion.levels.proficient}`,
        )
        .join("\n");
      return `### ${dimension.name}\n${criteria}`;
    })
    .join("\n\n");
}

export function isCalibrated(): boolean {
  return rubric.status === "calibrated";
}
