/**
 * registry.ts — The single place that BINDS tools to the MCP server.
 *
 * We do all the repetitive work here once:
 *  - register the tool with the SDK (registerTool)
 *  - wrap the handler in try/catch (one failing tool shouldn't crash the server)
 *  - convert the result into the { content: [...] } shape MCP expects
 *
 * This keeps each tool file clean; it never has to know protocol details.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { AnyToolDefinition, ToolContext } from "./tool.js";
import { formatError } from "./errors.js";

export function registerTools(server: McpServer, tools: AnyToolDefinition[], ctx: ToolContext): void {
  for (const tool of tools) {
    // MCP UI hints. Read tools (list_*/get_*) are read-only, so clients (e.g.
    // Claude's connector) can group them as "always allow"; everything else is a
    // write that "needs approval". We expose NO delete/destructive tools (policy),
    // so destructiveHint is always false. A tool may override via its annotations.
    const readOnlyHint = tool.annotations?.readOnlyHint ?? /^(list|get)_/.test(tool.name);
    const destructiveHint = tool.annotations?.destructiveHint ?? false;

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema,
        annotations: { readOnlyHint, destructiveHint },
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await tool.handler(args as never, ctx);
          // If it's not plain text, render it as readable JSON.
          const text = typeof result === "string" ? result : JSON.stringify(result, null, 2);
          return { content: [{ type: "text" as const, text }] };
        } catch (err) {
          // On error we don't take the server down; we return isError to the client.
          console.error(`[tool:${tool.name}] error:`, err);
          return {
            content: [{ type: "text" as const, text: formatError(err) }],
            isError: true,
          };
        }
      }
    );
  }
}
