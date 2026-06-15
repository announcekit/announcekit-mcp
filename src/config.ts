/**
 * config.ts — All settings come from one place: environment variables.
 *
 * Why one file? Part of our "solid foundation" goal: things like the endpoint
 * or credentials are never hard-coded; when they change, only this file changes
 * and the rest stays unaware.
 */

export interface Config {
  /** Announcekit backend root URL, e.g. http://localhost:3000 */
  apiBaseUrl: string;
  /** GraphQL v2 path, e.g. /gq/v2 */
  graphqlPath: string;
  /** Combined full GraphQL URL (apiBaseUrl + graphqlPath) */
  graphqlUrl: string;
  auth: {
    /** Personal access token (preferred). Works with any login method. */
    token?: string;
    /** Fallback credentials for local/dev use only. */
    email?: string;
    password?: string;
  };
}

export function loadConfig(): Config {
  // Defaults to production so the published package works out of the box.
  // For local development, override ANNOUNCEKIT_API_URL with http://localhost:3000.
  const apiBaseUrl = process.env.ANNOUNCEKIT_API_URL ?? "https://announcekit.app";
  const graphqlPath = process.env.ANNOUNCEKIT_GRAPHQL_PATH ?? "/gq/v2";
  // Strip a trailing "/" so we don't end up with "http://x//gq/v2".
  const graphqlUrl = apiBaseUrl.replace(/\/+$/, "") + graphqlPath;

  return {
    apiBaseUrl,
    graphqlPath,
    graphqlUrl,
    auth: {
      token: process.env.ANNOUNCEKIT_TOKEN,
      email: process.env.ANNOUNCEKIT_EMAIL,
      password: process.env.ANNOUNCEKIT_PASSWORD,
    },
  };
}
