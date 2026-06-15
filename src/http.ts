#!/usr/bin/env node
/**
 * http.ts — HOSTED entry point (multi-tenant, Streamable HTTP transport).
 *
 * Runs as a long-lived service (e.g. mcp.announcekit.com). Unlike stdio, MANY
 * customers hit the same process, each authenticating with their OWN token via
 * the Authorization header. So auth + client are built PER REQUEST, and we run
 * statelessly: a fresh MCP server + transport per request.
 */

import express from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { loadConfig } from "./config.js";
import { TokenAuthProvider } from "./client/auth.js";
import { AnnouncekitClient } from "./client/announcekitClient.js";
import { buildServer, TOOL_COUNT } from "./server.js";

const config = loadConfig();
const PORT = Number(process.env.PORT ?? 8080);

const app = express();
app.use(express.json({ limit: "4mb" }));

// Health check for the load balancer / k8s probes.
app.get("/health", (_req, res) => {
  res.json({ ok: true, tools: TOOL_COUNT });
});

function bearer(req: express.Request): string | null {
  const h = req.header("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice("Bearer ".length).trim() : null;
}

app.post("/mcp", async (req, res) => {
  const token = bearer(req);
  if (!token) {
    res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Missing or invalid Authorization: Bearer token" },
      id: null,
    });
    return;
  }

  // Per-request: this customer's token -> their own client + server instance.
  const client = new AnnouncekitClient({
    graphqlUrl: config.graphqlUrl,
    auth: new TokenAuthProvider(token),
  });
  const server = buildServer({ client });
  // Stateless mode: no session id, one server+transport per request.
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

// Stateless server: GET/DELETE (SSE stream / session end) are not supported.
const methodNotAllowed = (_req: express.Request, res: express.Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed (stateless server)." },
    id: null,
  });
};
app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

app.listen(PORT, () => {
  console.error(`[announcekit-mcp] ready (http) on :${PORT}. ${TOOL_COUNT} tools. API: ${config.graphqlUrl}`);
});
