/**
 * prompts/index.ts — Ready-made prompts.
 *
 * MCP prompts show up in the client as one-click actions, so a non-technical
 * user doesn't have to know what to ask. Each one returns a user message that
 * drives the tools; the server-level instructions (see server.ts) already tell
 * the model to resolve the project first and to keep posts as drafts.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const userMessage = (text: string) => ({
  messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
});

export function registerPrompts(server: McpServer): void {
  server.registerPrompt(
    "draft_release_note",
    {
      title: "Draft a release note",
      description: "Turn a description of recent changes into a draft AnnounceKit post.",
      argsSchema: { changes: z.string().describe("What changed — features, fixes, improvements") },
    },
    ({ changes }) =>
      userMessage(
        `Draft an AnnounceKit release-note post from these changes:\n\n${changes}\n\n` +
          `Write it user-facing and concise — a clear title and a short body. If it's unclear which ` +
          `project this is for, call list_projects and ask me. Create it as a DRAFT (do not publish).`
      )
  );

  server.registerPrompt(
    "weekly_feedback_summary",
    {
      title: "Summarize this week's feedback",
      description: "Summarize the last 7 days of feedback and feature requests.",
    },
    () =>
      userMessage(
        `Summarize my AnnounceKit feedback and feature requests from the last 7 days: the common themes, ` +
          `the most-requested items, and anything urgent. If it's unclear which project this is for, call ` +
          `list_projects and ask me first.`
      )
  );

  server.registerPrompt(
    "whats_next",
    {
      title: "What should I announce next?",
      description: "Suggest what to announce or build next, from the roadmap and recent feedback.",
    },
    () =>
      userMessage(
        `Based on my AnnounceKit roadmap and recent feedback/feature requests, suggest what I should ` +
          `announce or build next, with a short rationale for each suggestion. If it's unclear which ` +
          `project this is for, call list_projects and ask me first.`
      )
  );
}
