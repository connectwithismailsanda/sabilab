import type { Scenario } from "@/content/scenarios";
import { numbersIn } from "./verify";

/**
 * Arithmetic is checked in code, never by the model.
 * Every figure the scorer is allowed to call correct is listed here.
 */
export type ScoringChecks = {
  answerKeyFigures: number[];
  computed: Record<string, number>;
  allowedFigures: number[];
};

const computedByScenario: Record<string, Record<string, number>> = {
  "adaeze-fabrics": {
    cash_after_overdue_invoice: 130_000,
    cash_after_rent: 360_000,
    cash_after_invoice_and_rent: 10_000,
    full_order_value: 1_000_000,
    discount_at_20_percent: 200_000,
    discount_at_10_percent: 100_000,
  },
  "funke-kitchen": {
    order_value: 300_000,
    shortfall: 50,
    margin_per_outsourced_pack: 400,
    outsource_50_cost: 105_000,
    refund_50_cost: 125_000,
    credit_on_shortfall: 12_500,
  },
};

export function scenarioChecks(scenario: Scenario): ScoringChecks {
  const computed = computedByScenario[scenario.slug] ?? {};
  const allowed = new Set<number>([
    ...scenario.keyNumbers,
    ...Object.values(computed),
  ]);

  return {
    answerKeyFigures: [...scenario.keyNumbers],
    computed,
    allowedFigures: [...allowed].sort((a, b) => a - b),
  };
}

/** Numbers a student actually wrote, limited to the scenario answer key. */
export function verifiedKeyFigures(
  scenario: Scenario,
  text: string,
): number[] {
  const present = new Set(numbersIn(text));
  return [...new Set(scenario.keyNumbers)]
    .filter((value) => present.has(value))
    .sort((a, b) => a - b);
}
