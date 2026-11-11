import { describe, expect, it } from "vitest";
import { getScenario } from "@/content/scenarios";
import { scoreTask } from "@/lib/scoring/engine";
import {
  extractSentences,
  findQuote,
  numbersIn,
} from "@/lib/scoring/verify";

const scenario = getScenario("adaeze-fabrics")!;

const answer =
  "I would offer Mrs Bello 10% off, which is ₦100,000, and keep the other ₦100,000 as a credit for her next order. I would pay Kano Textiles ₦150,000 today to restart supply, because we only have 12 blue rolls and rent of ₦120,000 is due Friday. That leaves cash for the 2pm delivery, so we keep the customer and protect the rent.";

describe("quote verification", () => {
  it("accepts an exact quote", () => {
    expect(findQuote(answer, "I would pay Kano Textiles ₦150,000 today")).not.toBeNull();
  });

  it("accepts different whitespace", () => {
    expect(findQuote("We  should\npay Kano today.", "We should pay Kano today.")).not.toBeNull();
  });

  it("rejects a paraphrase that is not in the text", () => {
    expect(findQuote(answer, "I would offer a 20% discount")).toBeNull();
  });

  it("rejects an invented quote", () => {
    expect(findQuote(answer, "Pay the full invoice immediately")).toBeNull();
  });
});

describe("sentence extraction", () => {
  it("keeps quotes as substrings of the original body", () => {
    for (const sentence of extractSentences(answer)) {
      expect(answer.includes(sentence.text)).toBe(true);
    }
  });
});

describe("number extraction", () => {
  it("reads figures with separators", () => {
    expect(numbersIn("₦1,000,000 and 350,000 and 12")).toEqual([
      1_000_000,
      350_000,
      12,
    ]);
  });
});

describe("stub scorer", () => {
  const result = scoreTask(scenario, answer);

  it("returns one criterion per dimension", () => {
    expect(result.criteria).toHaveLength(4);
  });

  it("never awards above Proficient", () => {
    const allowed = [
      "proficient",
      "foundation",
      "needs_practice",
      "insufficient_evidence",
    ];
    for (const criterion of result.criteria) {
      expect(allowed).toContain(criterion.level);
    }
  });

  it("attaches only verified quotes", () => {
    for (const criterion of result.criteria) {
      if (criterion.quote) {
        expect(criterion.verified).toBe(true);
        expect(findQuote(answer, criterion.quote)).not.toBeNull();
      } else {
        expect(criterion.level).toBe("insufficient_evidence");
      }
    }
  });

  it("finds the key figures used in the answer", () => {
    expect(result.summary.figures).toEqual(
      expect.arrayContaining([100_000, 150_000, 120_000]),
    );
  });

  it("keeps every result flagged for review", () => {
    expect(result.needsReview).toBe(true);
  });

  it("does not score an empty answer", () => {
    const empty = scoreTask(scenario, "   ");
    for (const criterion of empty.criteria) {
      expect(criterion.level).toBe("insufficient_evidence");
      expect(criterion.quote).toBeNull();
    }
  });
});

const kitchen = getScenario("funke-kitchen")!;
const kitchenAnswer =
  "I would call Mr Bassey before 11:30, deliver 70 packs at 12:30 and outsource the other 50 at ₦2,100 each, which costs ₦105,000. That keeps ₦400 a pack instead of refunding ₦2,500, and it protects the contract credit.";

describe("scenario 2 config", () => {
  const result = scoreTask(kitchen, kitchenAnswer);

  it("scores all four dimensions", () => {
    expect(result.criteria).toHaveLength(4);
  });

  it("returns quotes that exist in the answer", () => {
    for (const criterion of result.criteria) {
      if (criterion.quote) {
        expect(findQuote(kitchenAnswer, criterion.quote)).not.toBeNull();
      }
    }
  });

  it("finds the scenario's figures", () => {
    expect(result.summary.figures).toEqual(
      expect.arrayContaining([70, 50, 2_100]),
    );
  });
});
