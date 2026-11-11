/**
 * Server-only LLM client. The API key never reaches the browser.
 *
 * Configure with environment variables (see .env.example):
 *   SABILAB_LLM_API_KEY    required to use the LLM scorer
 *   SABILAB_LLM_MODEL      required; pin the exact model you tested
 *   SABILAB_LLM_PROVIDER   "openai" (default, any compatible endpoint) or "anthropic"
 *   SABILAB_LLM_BASE_URL   optional override
 *
 * If the key or model is missing, the app falls back to the rule-based scorer.
 */

export type LlmProvider = "openai" | "anthropic";

export type LlmConfig = {
  provider: LlmProvider;
  apiKey: string;
  model: string;
  baseUrl: string;
};

export type JsonCompletionRequest = {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Optional per-call model override, for the cheaper reading pass. */
  model?: string;
};

export type JsonCompletionResult = {
  json: unknown;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
};

export type JsonCompleter = (
  request: JsonCompletionRequest,
) => Promise<JsonCompletionResult>;

export class LlmNotConfiguredError extends Error {
  constructor() {
    super("LLM is not configured");
    this.name = "LlmNotConfiguredError";
  }
}

export class LlmError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LlmError";
    this.status = status;
  }
}

export function getLlmConfig(): LlmConfig | null {
  const apiKey = process.env.SABILAB_LLM_API_KEY?.trim();
  const model = process.env.SABILAB_LLM_MODEL?.trim();
  if (!apiKey || !model) return null;

  const rawProvider = (process.env.SABILAB_LLM_PROVIDER ?? "openai")
    .trim()
    .toLowerCase();
  if (rawProvider !== "openai" && rawProvider !== "anthropic") {
    throw new LlmError(
      `Unknown SABILAB_LLM_PROVIDER "${rawProvider}". Use "openai" or "anthropic".`,
    );
  }

  const configuredBase = process.env.SABILAB_LLM_BASE_URL?.trim();
  const baseUrl = (
    configuredBase ||
    (rawProvider === "anthropic"
      ? "https://api.anthropic.com/v1"
      : "https://api.openai.com/v1")
  ).replace(/\/+$/, "");

  return { provider: rawProvider, apiKey, model, baseUrl };
}

export function isLlmConfigured(): boolean {
  try {
    return getLlmConfig() !== null;
  } catch {
    return false;
  }
}

async function requestOnce(
  config: LlmConfig,
  input: JsonCompletionRequest,
  options: { jsonMode: boolean },
): Promise<Response> {
  const maxTokens = input.maxTokens ?? 1400;
  const temperature = input.temperature ?? 0;
  const model = input.model ?? config.model;

  if (config.provider === "anthropic") {
    return fetch(`${config.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: input.system,
        messages: [{ role: "user", content: input.user }],
      }),
      signal: AbortSignal.timeout(30_000),
    });
  }

  return fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
      ...(options.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(30_000),
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonText(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) throw new LlmError("LLM returned an empty response");

  const unfenced = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1));
      } catch {
        // Fall through to the error below.
      }
    }
    throw new LlmError("LLM did not return valid JSON");
  }
}

export async function completeJson(
  input: JsonCompletionRequest,
): Promise<JsonCompletionResult> {
  const config = getLlmConfig();
  if (!config) throw new LlmNotConfiguredError();

  let jsonMode = config.provider === "openai";
  let response: Response | null = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    response = await requestOnce(config, input, { jsonMode });
    if (response.ok) break;

    const detail = (await response.text()).slice(0, 300);

    // Some OpenAI-compatible providers reject response_format. Retry without it.
    if (jsonMode && response.status === 400) {
      jsonMode = false;
      attempt -= 1;
      continue;
    }

    // One retry for rate limits and transient server errors.
    if ((response.status === 429 || response.status >= 500) && attempt === 0) {
      await delay(700);
      continue;
    }

    throw new LlmError(
      `LLM request failed with ${response.status}: ${detail}`,
      response.status,
    );
  }

  if (!response || !response.ok) {
    throw new LlmError("LLM request failed");
  }

  const payload = (await response.json()) as unknown;

  if (config.provider === "anthropic") {
    const data = payload as {
      model?: string;
      content?: { type?: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (data.content ?? [])
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("");
    const usage = data.usage
      ? {
          inputTokens: data.usage.input_tokens ?? 0,
          outputTokens: data.usage.output_tokens ?? 0,
        }
      : undefined;
    return {
      json: parseJsonText(text),
      model: data.model ?? config.model,
      usage,
    };
  }

  const data = payload as {
    model?: string;
    choices?: { message?: { content?: string | null } }[];
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  const usage = data.usage
    ? {
        inputTokens: data.usage.prompt_tokens ?? 0,
        outputTokens: data.usage.completion_tokens ?? 0,
      }
    : undefined;

  return {
    json: parseJsonText(text),
    model: data.model ?? config.model,
    usage,
  };
}
