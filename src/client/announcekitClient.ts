/**
 * announcekitClient.ts — The SINGLE adapter that talks to Announcekit.
 *
 * All GraphQL traffic goes through here. Endpoint, auth, and error mapping live
 * in one place. Tools call `client.graphql(query, variables)` and know nothing
 * else. If the endpoint or auth changes, only this file (and auth.ts) changes.
 */

import type { AuthProvider } from "./auth.js";
import { ApiError } from "../core/errors.js";

interface ClientOptions {
  graphqlUrl: string;
  auth: AuthProvider;
  /**
   * Identifies which MCP transport made this request (e.g. "announcekit-mcp-http"
   * / "announcekit-mcp-stdio"), sent as the `X-AnnounceKit-Client` header.
   */
  clientLabel?: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

export class AnnouncekitClient {
  constructor(private readonly opts: ClientOptions) {}

  /**
   * Runs a GraphQL query/mutation and returns the `data` part.
   * Adds auth headers automatically; maps GraphQL/HTTP errors to ApiError.
   */
  async graphql<T = unknown>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const authHeaders = await this.opts.auth.getAuthHeaders();

    const res = await fetch(this.opts.graphqlUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(this.opts.clientLabel ? { "x-announcekit-client": this.opts.clientLabel } : {}),
        ...authHeaders,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!res.ok) {
      throw new ApiError(`HTTP ${res.status} ${res.statusText}`);
    }

    const body = (await res.json()) as GraphQLResponse<T>;

    if (body.errors?.length) {
      // There can be multiple errors; collect them into one message.
      throw new ApiError(body.errors.map((e) => e.message).join("; "));
    }
    if (body.data === undefined) {
      throw new ApiError("Empty response: no data field.");
    }

    return body.data;
  }
}
