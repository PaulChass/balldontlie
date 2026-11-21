/**
 * Model registry + pricing for the NBA agent.
 *
 * Prices are Anthropic first-party API rates in USD per 1M tokens (as of the
 * claude-api skill's 2026-11-03 snapshot). Keeping them here, next to the
 * token accounting, lets every run report an honest, reproducible $ estimate —
 * and sets up the cost-routing pillar (light model for lookups, bigger model
 * for multi-step reasoning) as a one-line model switch.
 */

export interface ModelPricing {
  /** USD per 1M uncached input tokens. */
  inputPerMTok: number;
  /** USD per 1M output tokens. */
  outputPerMTok: number;
  /** USD per 1M cache-read input tokens. */
  cacheReadPerMTok: number;
}

export interface ModelSpec {
  id: string;
  label: string;
  pricing: ModelPricing;
}

/**
 * Current-generation Claude models. Keys are short aliases usable on the CLI
 * (`--model haiku`); the raw model id is also accepted.
 */
export const MODELS = {
  opus: {
    id: "claude-opus-5-5",
    label: "Opus 5.5",
    pricing: { inputPerMTok: 4, outputPerMTok: 20, cacheReadPerMTok: 0.4 },
  },
  sonnet: {
    id: "claude-sonnet-5-5",
    label: "Sonnet 5.5",
    pricing: { inputPerMTok: 2, outputPerMTok: 10, cacheReadPerMTok: 0.2 },
  },
  haiku: {
    id: "claude-haiku-5-5",
    label: "Haiku 5.5",
    // Cache-read price for Haiku 5.5 is not published in the skill snapshot;
    // 0.01 (~0.1x input) is the usual ratio and is only used for the estimate.
    pricing: { inputPerMTok: 0.1, outputPerMTok: 0.5, cacheReadPerMTok: 0.01 },
  },
} as const satisfies Record<string, ModelSpec>;

export type ModelKey = keyof typeof MODELS;

/** Default model for the Q&A agent: capable enough for multi-step tool use. */
export const DEFAULT_MODEL: ModelKey = "opus";

/** Resolve a CLI value (alias like "haiku", or a raw "claude-..." id) to a spec. */
export function resolveModel(input?: string): ModelSpec {
  if (!input) return MODELS[DEFAULT_MODEL];
  const key = input.toLowerCase();
  if (key in MODELS) return MODELS[key as ModelKey];
  // Accept a raw model id; price it from the matching family if we know it.
  const known = Object.values(MODELS).find((m) => m.id === input);
  if (known) return known;
  return {
    id: input,
    label: input,
    pricing: { inputPerMTok: 0, outputPerMTok: 0, cacheReadPerMTok: 0 },
  };
}

export interface UsageTotals {
  /** Uncached input tokens (Anthropic `usage.input_tokens`). */
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheCreationTokens: number;
}

export function emptyUsage(): UsageTotals {
  return { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
}

/** Fold one API response's usage into a running total. */
export function addUsage(
  total: UsageTotals,
  usage: {
    input_tokens?: number;
    output_tokens?: number;
    cache_read_input_tokens?: number | null;
    cache_creation_input_tokens?: number | null;
  },
): void {
  total.inputTokens += usage.input_tokens ?? 0;
  total.outputTokens += usage.output_tokens ?? 0;
  total.cacheReadTokens += usage.cache_read_input_tokens ?? 0;
  total.cacheCreationTokens += usage.cache_creation_input_tokens ?? 0;
}

/** Estimate the USD cost of a run. Cache writes are billed at ~1.25x input. */
export function estimateCostUsd(u: UsageTotals, pricing: ModelPricing): number {
  const input = (u.inputTokens / 1e6) * pricing.inputPerMTok;
  const cacheRead = (u.cacheReadTokens / 1e6) * pricing.cacheReadPerMTok;
  const cacheWrite = (u.cacheCreationTokens / 1e6) * pricing.inputPerMTok * 1.25;
  const output = (u.outputTokens / 1e6) * pricing.outputPerMTok;
  return input + cacheRead + cacheWrite + output;
}
