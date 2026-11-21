/**
 * Bridge between the balldontlie MCP server (local, over stdio) and the
 * Anthropic Messages API.
 *
 * The agent runs the MCP client itself — it spawns the server as a subprocess,
 * lists its tools, and converts each MCP tool into an Anthropic tool definition.
 * (The API's server-side MCP connector is for remote URL servers; a local stdio
 * server is driven client-side like this.) When the model calls a tool, the
 * bridge invokes it over MCP and hands the result back verbatim — so every
 * number the model sees comes from a real tool response.
 */
import { fileURLToPath } from "node:url";
import type Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/client";
import { getDefaultEnvironment, StdioClientTransport } from "@modelcontextprotocol/client/stdio";

/** A text block as returned inside an MCP tool result. */
interface McpContentBlock {
  type: string;
  text?: string;
}

interface McpToolResult {
  isError?: boolean;
  content: McpContentBlock[];
  structuredContent?: unknown;
}

interface McpToolListEntry {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

/** Default path to the built MCP server entrypoint, resolved from this file. */
function defaultServerEntry(): string {
  const override = process.env.BALLDONTLIE_MCP_ENTRY;
  if (override) return override;
  // From ai/agent/{src,dist}/mcpBridge.{ts,js} -> ai/mcp-server/dist/index.js
  return fileURLToPath(new URL("../../mcp-server/dist/index.js", import.meta.url));
}

export class McpBridge {
  private client: Client;
  private connected = false;
  private readonly serverEntry: string;

  constructor(serverEntry?: string) {
    this.serverEntry = serverEntry ?? defaultServerEntry();
    this.client = new Client({ name: "balldontlie-nba-agent", version: "0.1.0" });
  }

  async connect(): Promise<void> {
    await this.client.connect(
      new StdioClientTransport({
        command: process.execPath, // the current node binary
        args: [this.serverEntry],
        env: { ...getDefaultEnvironment() },
      }),
    );
    this.connected = true;
  }

  /** List the server's tools, each converted to an Anthropic tool definition. */
  async listAnthropicTools(): Promise<Anthropic.Tool[]> {
    const { tools } = (await this.client.listTools()) as { tools: McpToolListEntry[] };
    return tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      // MCP inputSchema is already JSON Schema (type: object); pass it through.
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));
  }

  /** Invoke one tool by name; returns its content blocks and error flag. */
  async callTool(
    name: string,
    input: Record<string, unknown>,
  ): Promise<{ text: string; isError: boolean }> {
    const result = (await this.client.callTool({
      name,
      arguments: input,
    })) as McpToolResult;
    const text = result.content
      .map((c) => (typeof c.text === "string" ? c.text : ""))
      .filter(Boolean)
      .join("\n");
    return { text, isError: result.isError === true };
  }

  async close(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}
