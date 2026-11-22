/**
 * Low-level HTTP client for the NBA data sources.
 *
 * One place owns the browser-like headers, the timeout, and the translation of
 * failures into messages a model can act on. Every tool goes through here.
 */
import {
  fetch as undiciFetch,
  Agent,
  type Response as UndiciResponse,
} from "undici";
import { NBA_STATS_HEADERS } from "../constants.js";

/** Default per-request timeout. stats.nba.com is slow and occasionally stalls. */
const REQUEST_TIMEOUT_MS = 20_000;

/**
 * Shared connection pool that negotiates HTTP/2 over TLS (with automatic
 * fallback to HTTP/1.1 via ALPN). cdn.nba.com (Akamai) answers 403 to HTTP/1.1
 * requests from datacenter IPs but 200 over HTTP/2 — the same reason the PHP app
 * sets CURL_HTTP_VERSION_2TLS. Node's global fetch is HTTP/1.1-only, so we route
 * every request through an undici dispatcher with allowH2 enabled.
 */
const h2Dispatcher = new Agent({ allowH2: true });

/**
 * Error carrying an HTTP status (or 0 for network/timeout failures) plus a
 * recovery-oriented message. Tool handlers may let this propagate: the SDK
 * surfaces the message to the model as the tool result text.
 */
export class NbaApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "NbaApiError";
  }
}

function describeStatus(status: number, source: string): string {
  switch (status) {
    case 403:
      return `${source} rejected the request (403). The endpoint throttles non-browser traffic; retry after a short delay.`;
    case 429:
      return `${source} rate limit hit (429). Wait before making more requests.`;
    case 404:
      return `${source} returned 404. Check the id or parameters.`;
    default:
      return `${source} returned HTTP ${status}.`;
  }
}

/**
 * GET a URL from an NBA source and parse JSON.
 *
 * @param url     Fully-formed URL (query string already built by the caller).
 * @param source  Human label used in error messages, e.g. "stats.nba.com".
 * @param signal  Optional caller cancellation signal (from the MCP request).
 * @param headers Extra headers; stats.nba.com headers are the default.
 */
export async function nbaFetchJson<T>(
  url: string,
  source: string,
  signal?: AbortSignal,
  headers: Record<string, string> = NBA_STATS_HEADERS,
): Promise<T> {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: UndiciResponse;
  try {
    response = await undiciFetch(url, {
      headers,
      signal: composed,
      dispatcher: h2Dispatcher,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new NbaApiError(
        0,
        `${source} did not respond within ${REQUEST_TIMEOUT_MS / 1000}s. Retry, or narrow the request.`,
      );
    }
    throw new NbaApiError(
      0,
      `Could not reach ${source}: ${error instanceof Error ? error.message : String(error)}.`,
    );
  }

  if (!response.ok) {
    throw new NbaApiError(response.status, describeStatus(response.status, source));
  }

  try {
    return (await response.json()) as T;
  } catch {
    throw new NbaApiError(0, `${source} returned a response that was not valid JSON.`);
  }
}

/**
 * Shape of a stats.nba.com "resultSet": a header row plus parallel value rows.
 * The API returns columns positionally, so we always index them by header name.
 */
export interface ResultSet {
  headers: string[];
  rowSet: unknown[][];
}

/** A single stats row as a header-keyed record (values stay as-is). */
export type StatRow = Record<string, unknown>;

/**
 * Turn a positional resultSet into header-keyed rows.
 *
 * This is the robust replacement for the magic numeric indices the PHP code
 * used (e.g. `rowSet[i][26]` for points): columns are matched by their header
 * name, so a column reorder upstream no longer silently returns the wrong stat.
 */
export function rowsByHeader(resultSet: ResultSet): StatRow[] {
  const { headers, rowSet } = resultSet;
  return rowSet.map((row) => {
    const record: StatRow = {};
    for (let i = 0; i < headers.length; i++) {
      record[headers[i]] = row[i];
    }
    return record;
  });
}

/** Read a numeric field from a header-keyed row, or null when absent/non-numeric. */
export function num(row: StatRow, key: string): number | null {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/** Read a string field from a header-keyed row, or null when absent. */
export function str(row: StatRow, key: string): string | null {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? null : String(value);
}
