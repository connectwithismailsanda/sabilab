import type { Dimension } from "@/content/scenarios";

export type Recommendation = {
  title: string;
  drill: string;
  guide: string;
  habit: string;
  practice: string;
};

export const recommendations: Record<Dimension, Recommendation> = {
  role_skill: {
    title: "Make the numbers do the arguing",
    drill: "Before you write, list every figure in the brief and circle the two that decide the answer.",
    guide: "A recommendation earns trust when it shows the cost, the cash left and the consequence.",
    habit: "End every recommendation with one sentence that starts: 'The trade-off is…'",
    practice: "Adaeze's Fabrics, or any scenario where cash is short",
  },
  communication: {
    title: "Write to the person who acts",
    drill: "Rewrite one message three ways: to your boss, to a customer, to a supplier. Keep the facts the same.",
    guide: "Put the decision first, then the reason, then the next step. One idea per sentence.",
    habit: "Read your draft aloud once. If a sentence needs a second breath, split it.",
    practice: "Communication solo simulation",
  },
  leadership: {
    title: "Decide, then say what happens next",
    drill: "Take a messy situation and write the first three actions you would take, with an owner and a time.",
    guide: "Leadership in writing sounds like ownership: 'I will', 'we will', and a named next step.",
    habit: "End with: 'I will update you by [time].'",
    practice: "Leadership solo simulation",
  },
  creative_thinking: {
    title: "Always bring two options",
    drill: "For any problem, write three options and the cost of each. Cross out the one you cannot fund.",
    guide: "Creative does not mean clever. It means finding a second route when the first is blocked.",
    habit: "Before choosing, ask: 'What else could we do with what we already have?'",
    practice: "Creative thinking solo simulation",
  },
};
