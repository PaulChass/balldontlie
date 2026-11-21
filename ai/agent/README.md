# balldontlie-nba-agent

A **grounded NBA stats agent**. It answers a natural-language question by letting Claude plan and call the [balldontlie MCP tools](../mcp-server), then reports **only numbers that trace back to a tool result** — no stats from memory, no guessing.

It is the usage-A surface of the project: natural-language Q&A over real, parametrable NBA data.

## How it works

```
question ─▶ Claude (Messages API) ──tool_use──▶ MCP bridge ──stdio──▶ MCP server ──▶ stats.nba.com
                 ▲                                                                         │
                 └──────────────── tool_result (real numbers) ◀───────────────────────────┘
          (loop until the model answers)
```

The agent runs an explicit `while (stop_reason === "tool_use")` loop ([src/agent.ts](src/agent.ts)) rather than a framework runner — the orchestration is the point. On each turn it:

1. sends the conversation + the 9 tool definitions to Claude,
2. executes any tool calls over MCP and feeds the results back verbatim,
3. repeats until Claude produces a final, grounded answer.

A system-prompt **factuality contract** enforces the core rule: every figure must come from a tool result in the conversation, and the agent must say so when the tools can't answer. This is pillar 3 of the project (grounded, reproducible numbers) expressed as a prompt + a loop you can read.

## Run

```bash
# one-time: build the MCP server it drives
cd ../mcp-server && npm install && npm run build && cd -

npm install
npm run build

export ANTHROPIC_API_KEY=sk-ant-...        # or: ant auth login
npm run ask -- "How are the Warriors shooting from three this season?"
npm run ask -- --model haiku "Who plays tonight?"
npm run ask -- --json "Celtics last 5 games"
```

Each run prints the answer followed by a trace of the tools called and the **estimated token cost** of the run.

## Checks (no API key needed)

The hardest part — the MCP ↔ Anthropic integration — is testable offline:

```bash
npm run bridge-check   # spawns the server, lists & maps 9 tools, runs a real tool call
npm run loop-check     # runs the full agent loop against a stubbed model
```

Only the real model call needs a key; it is standard SDK usage.

## Model & cost

The model is a parameter ([src/models.ts](src/models.ts)) with the pricing table attached, so each run reports an honest `$` estimate and the cost-routing pillar is a one-line switch:

| Alias | Model | $/1M in | $/1M out | Intended role |
|-------|-------|---------|----------|---------------|
| `opus` (default) | `claude-opus-5-5` | $4 | $20 | multi-step reasoning |
| `sonnet` | `claude-sonnet-5-5` | $2 | $10 | mid-tier |
| `haiku` | `claude-haiku-5-5` | $0.10 | $0.50 | light single-tool lookups |

Prices are Anthropic first-party rates (claude-api reference, 2026-11-03 snapshot). Automatic model routing by question complexity is the next milestone (cost & routing pillar); today you pick the model per run.
