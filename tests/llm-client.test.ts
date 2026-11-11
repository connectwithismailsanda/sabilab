import { afterEach, describe, expect, it, vi } from "vitest";
import {
  completeJson,
  LlmNotConfiguredError,
} from "@/lib/llm/client";

function openAiResponse(content: string): Response {
  return new Response(
    JSON.stringify({
      model: "test-model-2026-01",
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 11, completion_tokens: 7 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function anthropicResponse(text: string): Response {
  return new Response(
    JSON.stringify({
      model: "claude-test",
      content: [{ type: "text", text }],
      usage: { input_tokens: 9, output_tokens: 4 },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("LLM client", () => {
  it("requires a key and a model", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "");
    vi.stubEnv("SABILAB_LLM_MODEL", "");

    await expect(
      completeJson({ system: "s", user: "u" }),
    ).rejects.toBeInstanceOf(LlmNotConfiguredError);
  });

  it("calls an OpenAI-compatible endpoint and parses fenced JSON", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "test-key");
    vi.stubEnv("SABILAB_LLM_MODEL", "test-model");
    vi.stubEnv("SABILAB_LLM_PROVIDER", "openai");

    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return openAiResponse('```json\n{"language":"english"}\n```');
      }),
    );

    const result = await completeJson({ system: "system", user: "user" });

    expect(result.json).toEqual({ language: "english" });
    expect(result.model).toBe("test-model-2026-01");
    expect(result.usage).toEqual({ inputTokens: 11, outputTokens: 7 });
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/chat/completions");

    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer test-key");

    const body = JSON.parse(String(calls[0]?.init.body)) as {
      response_format?: { type: string };
      messages: { role: string }[];
    };
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages.map((message) => message.role)).toEqual([
      "system",
      "user",
    ]);
  });

  it("calls the Anthropic messages endpoint with its own headers", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "test-key");
    vi.stubEnv("SABILAB_LLM_MODEL", "claude-test");
    vi.stubEnv("SABILAB_LLM_PROVIDER", "anthropic");

    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, init });
        return anthropicResponse('{"language":"english"}');
      }),
    );

    const result = await completeJson({ system: "system", user: "user" });

    expect(result.json).toEqual({ language: "english" });
    expect(calls[0]?.url).toBe("https://api.anthropic.com/v1/messages");

    const headers = calls[0]?.init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe("test-key");
    expect(headers["anthropic-version"]).toBe("2023-06-01");
  });

  it("retries once on a rate limit", async () => {
    vi.stubEnv("SABILAB_LLM_API_KEY", "test-key");
    vi.stubEnv("SABILAB_LLM_MODEL", "test-model");
    vi.stubEnv("SABILAB_LLM_PROVIDER", "openai");

    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response("rate limited", { status: 429 });
        }
        return openAiResponse('{"language":"english"}');
      }),
    );

    const result = await completeJson({ system: "s", user: "u" });
    expect(calls).toBe(2);
    expect(result.json).toEqual({ language: "english" });
  });
});
