/**
 * auth.ts — The AUTHENTICATION ABSTRACTION.
 *
 * This is the heart of our "solid foundation" goal. Tools and the client don't
 * know HOW auth works; they just ask "give me the auth headers". Two providers
 * implement the same AuthProvider contract:
 *   - TokenAuthProvider:   Bearer personal access token (production). Works with
 *                          any login method (Google/Microsoft/SAML/password).
 *   - SessionAuthProvider: email/password login → `sesid` cookie (local/dev).
 * Swapping or adding a provider changes only this file; the rest stays unaware.
 */

import { AuthError } from "../core/errors.js";

/** The contract tools/client see. One method: headers to attach to a request. */
export interface AuthProvider {
  getAuthHeaders(): Promise<Record<string, string>>;
}

/**
 * Token-based auth (the production approach). Works regardless of how the human
 * logs in (Google, Microsoft, SAML, password) because a personal access token
 * resolves to a user on the backend. Stateless: just a Bearer header.
 */
export class TokenAuthProvider implements AuthProvider {
  constructor(private readonly token: string) {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.token) {
      throw new AuthError("ANNOUNCEKIT_TOKEN must be set (.env).");
    }
    return { Authorization: `Bearer ${this.token}` };
  }
}

interface SessionAuthOptions {
  graphqlUrl: string;
  email?: string;
  password?: string;
  totpToken?: string;
}

/**
 * Session-cookie based auth (the prototype approach).
 * Logs in on the first request, caches the returned cookie, and reuses it on
 * later requests instead of logging in every time.
 */
export class SessionAuthProvider implements AuthProvider {
  private cookie: string | null = null;

  constructor(private readonly opts: SessionAuthOptions) {}

  async getAuthHeaders(): Promise<Record<string, string>> {
    if (!this.cookie) {
      await this.login();
    }
    return { Cookie: this.cookie! };
  }

  private async login(): Promise<void> {
    const { graphqlUrl, email, password, totpToken } = this.opts;
    if (!email || !password) {
      throw new AuthError("ANNOUNCEKIT_EMAIL and ANNOUNCEKIT_PASSWORD must be set (.env).");
    }

    const query = `
      mutation Login($email: String!, $password: String!, $totp: String) {
        login(email: $email, password: $password, totp_token: $totp) { id }
      }`;

    const res = await fetch(graphqlUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query,
        variables: { email, password, totp: totpToken ?? null },
      }),
    });

    const body = (await res.json()) as {
      data?: { login?: { id: string } };
      errors?: Array<{ message: string }>;
    };

    if (body.errors?.length) {
      throw new AuthError(`Login failed: ${body.errors[0].message}`);
    }
    if (!body.data?.login) {
      throw new AuthError("Login failed: unexpected response.");
    }

    // Capture Set-Cookie headers. Node 20+ fetch exposes getSetCookie().
    // We keep only the "name=value" part of each cookie and join them.
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length === 0) {
      throw new AuthError("No session cookie (sesid) found in the login response.");
    }
    this.cookie = setCookies.map((c) => c.split(";")[0]).join("; ");
  }
}
