import type { Level } from "@/content/scenarios";
import { LEVEL_RANK } from "./types";

/**
 * Rubric v0.2, section 7.
 *
 * - Sort the criterion levels and take the second one.
 * - Leave insufficient evidence out. If more than half are insufficient, the
 *   dimension is insufficient.
 * - If C1 Clarity is Needs practice, the dimension cannot exceed Foundation.
 */
export type DimensionAggregate = {
  level: Level;
  supported: number;
  majorityInsufficient: boolean;
  clarityCapped: boolean;
};

export function aggregateDimension(
  criteria: { id: string; level: Level }[],
): DimensionAggregate {
  const supported = criteria.filter(
    (criterion) => criterion.level !== "insufficient_evidence",
  );
  const majorityInsufficient = supported.length * 2 < criteria.length;

  if (supported.length === 0 || majorityInsufficient) {
    return {
      level: "insufficient_evidence",
      supported: supported.length,
      majorityInsufficient: true,
      clarityCapped: false,
    };
  }

  const sorted = [...supported].sort(
    (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level],
  );

  let level = sorted[1]?.level ?? sorted[0].level;
  let clarityCapped = false;

  const clarity = criteria.find((criterion) => criterion.id === "C1");
  if (
    clarity?.level === "needs_practice" &&
    LEVEL_RANK[level] > LEVEL_RANK.foundation
  ) {
    level = "foundation";
    clarityCapped = true;
  }

  return {
    level,
    supported: supported.length,
    majorityInsufficient: false,
    clarityCapped,
  };
}
