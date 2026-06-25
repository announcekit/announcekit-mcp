#!/usr/bin/env node
/**
 * index.ts — STDIO entry point (npm / local use).
 *
 * The MCP client (Claude Desktop, Cursor, etc.) spawns this as a subprocess and
 * talks over stdin/stdout. A single user, authenticated by one token from env.
 * For the hosted/multi-tenant variant see http.ts.
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config.js";
import type { AuthProvider } from "./client/auth.js";
import { TokenAuthProvider, SessionAuthProvider } from "./client/auth.js";
import { AnnouncekitClient } from "./client/announcekitClient.js";
import { buildServer, TOOL_COUNT } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig();

  // Prefer a personal access token; fall back to email/password (local/dev only).
  const auth: AuthProvider = config.auth.token
    ? new TokenAuthProvider(config.auth.token)
    : new SessionAuthProvider({
        graphqlUrl: config.graphqlUrl,
        email: config.auth.email,
        password: config.auth.password,
      });

  const client = new AnnouncekitClient({ graphqlUrl: config.graphqlUrl, auth, clientLabel: "announcekit-mcp-stdio" });
  const server = buildServer({ client });

  await server.connect(new StdioServerTransport());

  // STDOUT is the protocol channel — logs go to STDERR.
  console.error(`[announcekit-mcp] ready (stdio). ${TOOL_COUNT} tools registered. API: ${config.graphqlUrl}`);
}

main().catch((err) => {
  console.error("[announcekit-mcp] startup error:", err);
  process.exit(1);
});
