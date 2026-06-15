/**
 * server.ts — Shared MCP server factory.
 *
 * Both entry points (stdio for npm/local, HTTP for hosted) build their server
 * the same way: take a ToolContext (which holds the API client) and register
 * all tools. Only the TRANSPORT and HOW the client is created differ per entry.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { ToolContext } from "./core/tool.js";
import { registerTools } from "./core/registry.js";
import { allTools } from "./tools/index.js";

export const SERVER_INFO = { name: "announcekit-mcp", version: "0.1.0" };
export const TOOL_COUNT = allTools.length;

export function buildServer(ctx: ToolContext): McpServer {
  const server = new McpServer(SERVER_INFO);
  registerTools(server, allTools, ctx);
  return server;
}
