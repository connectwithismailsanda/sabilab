import type { Scenario } from "@/content/scenarios";
import { getLlmConfig } from "@/lib/llm/client";
import { PROMPT_VERSION } from "@/prompts/scoring.v0.2";
import { scoreTask } from "./engine";
import { scoreWithLlm } from "./llm";
import type { ScoreResult, ScoredSubmission, Transcript } from "./types";

const RULE_MODEL = "rule-based-stub";
const RULE_PROMPT_VERSION = "rule-stub.v2";
const RULE_RUBRIC_VERSION = "rule-fallback";

function ruleResult(
  scenario: Scenario,
  transcript: Transcript,
  label?: string,
): ScoreResult {
  const task = transcript.messages.find(
    (message) => message.id === transcript.taskId,
  );
  const result = scoreTask(scenario, task?.text ?? "");
  result.summary.engine = "rule-based";
  result.summary.rubricStatus = "stub";
  if (label) result.summary.label = label;
  return result;
}

/**
 * One entry point for grading. Uses the LLM rubric passes when configured, and
 * falls back to the deterministic rule scorer when it is not, or when the calls
 * fail twice.
 *
 * The rubric's transcript criteria (questions asked, delegation, support,
 * iteration) are only applied by the LLM path. The rule fallback reads the task
 * answer only, and every surface says so.
 */
export async function scoreSubmission(
  scenario: Scenario,
  transcript: Transcript,
): Promise<ScoredSubmission> {
  let configured = false;
  let configError: string | null = null;

  try {
    configured = getLlmConfig() !== null;
  } catch (error) {
    configError = error instanceof Error ? error.message : String(error);
  }

  const fallbackMeta = (reason: string) => ({
    engine: "rule-based" as const,
    model: RULE_MODEL,
    promptVersion: RULE_PROMPT_VERSION,
    rubricVersion: RULE_RUBRIC_VERSION,
    fallbackReason: reason,
  });

  if (!configured) {
    return {
      result: ruleResult(
        scenario,
        transcript,
        configError
          ? "The AI scorer is misconfigured, so these are rule-based provisional scores from the task answer only. A quote is still required for every level."
          : "No AI scorer is configured in this build, so these are rule-based provisional scores from the task answer only. The rubric's huddle criteria were not applied.",
      ),
      meta: fallbackMeta(configError ?? "llm_not_configured"),
    };
  }

  try {
    return await scoreWithLlm(scenario, transcript);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[sabilab] LLM scoring failed, using rule fallback: ${message.slice(0, 300)}`,
    );

    return {
      result: ruleResult(
        scenario,
        transcript,
        "The AI scorer was unavailable, so these are rule-based provisional scores from the task answer only. Try again later for the full rubric.",
      ),
      meta: fallbackMeta(message.slice(0, 300)),
    };
  }
}
