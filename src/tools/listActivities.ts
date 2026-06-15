/**
 * list_activities — Lists recent activity events (views, clicks, feedback, votes)
 * for a project or a single post.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  activities: {
    page: number;
    pages: number;
    count: number;
    items: Array<{
      id: string;
      type: string;
      created_at: string;
      post_id: string | null;
      external_user: { name: string | null; email: string | null } | null;
    }>;
  };
}

export default defineTool({
  name: "list_activities",
  title: "List Activities",
  description:
    "Lists recent activity events (views, clicks, feedback, votes) for a project, " +
    "optionally filtered to a single post. Shows who did what and when.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().optional().describe("Limit to one post (optional)"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0"),
  },
  handler: async ({ project_id, post_id, page }, { client }) => {
    const data = await client.graphql<Result>(
      `query ListActivities($project_id:ID!,$post_id:ID,$page:Int){
         activities(project_id:$project_id,post_id:$post_id,page:$page){
           page pages count
           items { id type created_at post_id external_user { name email } }
         }
       }`,
      { project_id, post_id, page },
    );
    return data.activities;
  },
});
