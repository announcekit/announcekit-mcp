/**
 * improve_text — Runs AnnounceKit's built-in AI text actions on a snippet:
 * fix grammar, change tone, shorten, or translate.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface AiActionResult {
  aiActions: { originalText: string; processedText: string; actionType: string };
}

export default defineTool({
  name: "improve_text",
  title: "Improve Text (AI)",
  description:
    "Improves a text snippet with AnnounceKit's built-in AI: fix grammar, make it " +
    "more friendly/formal/concise, or translate it (use target_language). Max " +
    "5000 characters. Returns the processed text; it does NOT change any post — " +
    "use update_post to save the result.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    text: z.string().min(1).max(5000).describe("The text to process (max 5000 chars)"),
    action: z
      .enum(["fixGrammar", "moreFriendly", "moreFormal", "moreConcise", "translate"])
      .describe("What to do with the text"),
    target_language: z
      .string()
      .optional()
      .describe("Language code for translate, e.g. 'es', 'de', 'tr' (required when action=translate)"),
  },
  handler: async ({ project_id, text, action, target_language }, { client }) => {
    let actionType: string = action;
    if (action === "translate") {
      if (!target_language) throw new Error("target_language is required when action=translate");
      actionType = `translate-${target_language}`;
    }

    const data = await client.graphql<AiActionResult>(
      `mutation ImproveText($project_id: ID!, $actionType: String!, $text: String!) {
         aiActions(project_id: $project_id, actionType: $actionType, text: $text) {
           processedText
           actionType
         }
       }`,
      { project_id, actionType, text },
    );
    return { processed_text: data.aiActions.processedText, action: data.aiActions.actionType };
  },
});
