/**
 * tool.ts — The TOOL CONTRACT.
 *
 * Every tool conforms to this shape. The goal: when writing a tool you only
 * think about "what it does"; the MCP protocol, validation, and error handling
 * are the registry's job.
 *
 * Type magic: we INFER the handler's argument type from inputSchema. So writing
 * `inputSchema: { project_id: z.string() }` makes `args.project_id` typed as a
 * string inside the handler. Misspell a field and TS will complain.
 */

import type { z, ZodRawShape } from "zod";
import type { AnnouncekitClient } from "../client/announcekitClient.js";

/** Dependencies available to a tool (for now just the API client). */
export interface ToolContext {
  client: AnnouncekitClient;
}

/** What a handler may return: plain text or an object that becomes JSON. */
export type ToolResult = string | Record<string, unknown> | unknown[];

export interface ToolDefinition<Shape extends ZodRawShape = ZodRawShape> {
  /** Name the model calls, e.g. "list_posts". Prefer snake_case. */
  name: string;
  /** Human-readable title (shown in the client UI). */
  title: string;
  /** The DESCRIPTION the model uses to decide "when should I call this". Critical. */
  description: string;
  /** Parameter schema (zod). The MCP SDK validates arguments with it. */
  inputSchema: Shape;
  /**
   * Optional MCP UI hints. Usually omitted — the registry derives sensible
   * defaults (read-only for list_/get_ tools; never destructive). Set only to
   * override.
   */
  annotations?: { readOnlyHint?: boolean; destructiveHint?: boolean };
  /** The actual work. Receives validated arguments and the context. */
  handler: (args: z.infer<z.ZodObject<Shape>>, ctx: ToolContext) => Promise<ToolResult>;
}

/**
 * Use this when defining a tool. Its only job is to trigger type inference:
 * `export default defineTool({ ... })`.
 */
export function defineTool<Shape extends ZodRawShape>(def: ToolDefinition<Shape>): ToolDefinition<Shape> {
  return def;
}

/**
 * A shape-agnostic common type for the registry/collection.
 *
 * We deliberately use `any` here: each tool has a different inputSchema (and
 * therefore a different handler argument type). Collecting them into a single
 * array (`allTools`) triggers a type error due to function-parameter
 * contravariance. Type safety is already enforced at each tool's own
 * defineTool() call; `any` at the collection level is the practical, safe choice.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyToolDefinition = ToolDefinition<any>;
