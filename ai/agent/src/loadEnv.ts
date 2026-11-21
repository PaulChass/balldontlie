/**
 * Minimal, dependency-free .env loader for the Anthropic credentials only.
 *
 * Walks up from the start directories looking for a `.env` file, and if one
 * defines ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN, copies *only those two
 * keys* into process.env. It deliberately does not import the rest of the file
 * (the project .env also holds unrelated secrets like DB credentials) and never
 * overrides a value already set in the environment.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const WANTED = ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN"] as const;

function parseKey(contents: string, key: string): string | undefined {
  for (const raw of contents.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    if (line.slice(0, eq).trim() !== key) continue;
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    return value;
  }
  return undefined;
}

/** Load Anthropic creds from the nearest .env, if not already in the env. */
export function loadAnthropicEnv(): void {
  if (WANTED.some((k) => process.env[k])) return;

  const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  const seen = new Set<string>();

  for (const start of starts) {
    let dir = start;
    while (true) {
      if (seen.has(dir)) break;
      seen.add(dir);

      const envPath = join(dir, ".env");
      if (existsSync(envPath)) {
        let contents = "";
        try {
          contents = readFileSync(envPath, "utf8");
        } catch {
          contents = "";
        }
        let found = false;
        for (const key of WANTED) {
          const value = parseKey(contents, key);
          if (value && !process.env[key]) {
            process.env[key] = value;
            found = true;
          }
        }
        if (found) return;
      }

      const parent = dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  }
}
