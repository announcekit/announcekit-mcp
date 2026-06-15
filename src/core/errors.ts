/**
 * errors.ts — A small set of typed error classes.
 *
 * Why? Instead of scattering "throw new Error('...')" across tools, we use
 * typed errors that say WHERE the failure happened (config, auth, or API).
 * The registry catches these and turns them into a clean message for the client.
 */

/** Base class for all MCP server errors. */
export class McpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name; // carry the subclass name (e.g. ConfigError)
  }
}

/** Missing/invalid configuration (env var, etc.). */
export class ConfigError extends McpError {}

/** Could not log in / invalid credentials. */
export class AuthError extends McpError {}

/** The Announcekit API returned an error (GraphQL errors or an HTTP failure). */
export class ApiError extends McpError {}

/**
 * Turns any error into a single-line message to show the client.
 * Handles unknown error shapes safely.
 */
export function formatError(err: unknown): string {
  if (err instanceof McpError) {
    return `${err.name}: ${err.message}`;
  }
  if (err instanceof Error) {
    return `Error: ${err.message}`;
  }
  return `Unknown error: ${String(err)}`;
}
