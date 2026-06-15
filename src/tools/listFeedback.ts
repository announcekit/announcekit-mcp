/**
 * list_feedback — Reads user feedback (reactions + comments) for a project or a
 * single post. Useful for summarizing what users think.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface FeedbackResult {
  feedbackCounts: Array<{ reaction: string; count: number }>;
  feedbacks: {
    page: number;
    pages: number;
    count: number;
    items: Array<{
      id: string;
      post_id: string | null;
      reaction: string | null;
      feedback: string | null;
      created_at: string;
      external_user: { name: string | null; email: string | null } | null;
    } | null>;
  };
}

export default defineTool({
  name: "list_feedback",
  title: "List Feedback",
  description:
    "Lists user feedback for a project (or one post): reaction counts plus the " +
    "individual comments with who left them. Great input for 'summarize what " +
    "users said about X'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().optional().describe("Limit to a single post (optional)"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0"),
  },
  handler: async ({ project_id, post_id, page }, { client }) => {
    const data = await client.graphql<FeedbackResult>(
      `query ListFeedback($project_id: ID!, $post_id: ID, $page: Int) {
         feedbackCounts(project_id: $project_id, post_id: $post_id) {
           reaction
           count
         }
         feedbacks(project_id: $project_id, post_id: $post_id, page: $page) {
           page
           pages
           count
           items {
             id
             post_id
             reaction
             feedback
             created_at
             external_user { name email }
           }
         }
       }`,
      { project_id, post_id, page },
    );
    return { reaction_counts: data.feedbackCounts, feedback: data.feedbacks };
  },
});
