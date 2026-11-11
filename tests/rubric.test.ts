import { describe, expect, it } from "vitest";
import { criteriaForScenario, rubric } from "@/content/rubric";
import { aggregateDimension } from "@/lib/scoring/aggregate";
import type { Level } from "@/content/scenarios";

function criteria(levels: Level[]) {
  return levels.map((level, index) => ({
    id: index === 0 ? "C1" : `C${index + 1}`,
    level,
  }));
}

describe("rubric v0.2 shape", () => {
  it("has fifteen criteria across four dimensions", () => {
    expect(rubric.criteria).toHaveLength(15);
    expect(new Set(rubric.criteria.map((item) => item.dimension)).size).toBe(4);
  });

  it("caps every path at Proficient", () => {
    expect(rubric.maxLevel).toBe("proficient");
    for (const criterion of rubric.criteria) {
      expect(Object.keys(criterion.levels)).toEqual([
        "needs_practice",
        "foundation",
        "proficient",
      ]);
    }
  });

  it("confines tone to C3", () => {
    expect(rubric.rules.toneAffectsOnly).toBe("C3");
  });

  it("adapts A2 for the beta operations scenario", () => {
    const accounts = criteriaForScenario("adaeze-fabrics").find(
      (item) => item.id === "A2",
    )!;
    const kitchen = criteriaForScenario("funke-kitchen").find(
      (item) => item.id === "A2",
    )!;

    expect(kitchen.levels.proficient).not.toBe(accounts.levels.proficient);
    expect(kitchen.levels.proficient).toContain("split");
  });
});

describe("dimension aggregation", () => {
  it("takes the second-lowest criterion", () => {
    const aggregate = aggregateDimension(
      criteria(["proficient", "needs_practice", "proficient", "foundation"]),
    );
    expect(aggregate.level).toBe("foundation");
  });

  it("leaves insufficient evidence out of the sort", () => {
    const aggregate = aggregateDimension(
      criteria(["insufficient_evidence", "proficient", "foundation", "proficient"]),
    );
    expect(aggregate.level).toBe("proficient");
  });

  it("caps the dimension at Foundation when C1 is Needs practice", () => {
    const aggregate = aggregateDimension(
      criteria([
        "needs_practice",
        "proficient",
        "proficient",
        "proficient",
      ]),
    );
    expect(aggregate.level).toBe("foundation");
    expect(aggregate.clarityCapped).toBe(true);
  });

  it("is insufficient when more than half the criteria lack evidence", () => {
    const aggregate = aggregateDimension(
      criteria([
        "insufficient_evidence",
        "insufficient_evidence",
        "insufficient_evidence",
        "proficient",
      ]),
    );
    expect(aggregate.level).toBe("insufficient_evidence");
    expect(aggregate.majorityInsufficient).toBe(true);
  });

  it("is not insufficient when exactly half lack evidence", () => {
    const aggregate = aggregateDimension(
      criteria([
        "insufficient_evidence",
        "insufficient_evidence",
        "foundation",
        "proficient",
      ]),
    );
    expect(aggregate.level).toBe("proficient");
  });

  it("is insufficient when every criterion lacks evidence", () => {
    const aggregate = aggregateDimension(
      criteria([
        "insufficient_evidence",
        "insufficient_evidence",
        "insufficient_evidence",
      ]),
    );
    expect(aggregate.level).toBe("insufficient_evidence");
  });

  it("handles the three-criterion role skill dimension", () => {
    const aggregate = aggregateDimension([
      { id: "A1", level: "foundation" },
      { id: "A2", level: "proficient" },
      { id: "A3", level: "proficient" },
    ]);
    expect(aggregate.level).toBe("proficient");
  });
});
