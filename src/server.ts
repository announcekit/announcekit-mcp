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
import { registerPrompts } from "./prompts/index.js";

export const SERVER_INFO = { name: "announcekit-mcp", version: "0.1.0" };
export const TOOL_COUNT = allTools.length;

// Sent to the client at initialize — guides the model so non-technical users get
// good results from plain requests.
const INSTRUCTIONS = [
  "AnnounceKit manages a product's changelog / release notes, feedback and roadmap.",
  "Before acting on posts, feedback or the roadmap, resolve the project: call",
  "list_projects first and, if it's unclear which project the user means, ask — then",
  "pass that project_id. New posts are created as DRAFTS; publishing is a separate,",
  "explicit step (publish_post / schedule_post) — never publish unless the user",
  "clearly asks. This server never deletes anything; deletions are done in the",
  "AnnounceKit dashboard.",
].join(" ");

export function buildServer(ctx: ToolContext): McpServer {
  const server = new McpServer(SERVER_INFO, { instructions: INSTRUCTIONS });
  registerTools(server, allTools, ctx);
  registerPrompts(server);
  return server;
}
