/**
 * list_posts — Lists the posts (announcements) in a project.
 * Returns status, title, and date. For an overview or to find a specific post.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface PostsResult {
  posts: {
    count: number;
    page: number;
    pages: number;
    list: Array<{
      id: string;
      status: string | null;
      is_draft: boolean;
      visible_at: string;
      defaultContent: { title: string };
    }>;
  };
}

export default defineTool({
  name: "list_posts",
  title: "List Posts",
  description:
    "Lists the posts (announcements) in a project. For each post it returns " +
    "the status (Live/Draft/Scheduled/Expired/Paused), title, and visibility " +
    "date. Supports pagination and a keyword/status filter.",
  inputSchema: {
    project_id: z.string().describe("The project ID (obtained from list_projects)"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0 (default 0)"),
    query: z.string().optional().describe("Keyword search in the title"),
    postStatus: z.string().optional().describe("Filter by status: Live, Draft, Scheduled, Expired, Paused"),
  },
  handler: async ({ project_id, page, query, postStatus }, { client }) => {
    const data = await client.graphql<PostsResult>(
      `query ListPosts($project_id: ID!, $page: Int, $query: String, $postStatus: String) {
         posts(project_id: $project_id, page: $page, query: $query, postStatus: $postStatus) {
           count
           page
           pages
           list {
             id
             status
             is_draft
             visible_at
             defaultContent { title }
           }
         }
       }`,
      { project_id, page, query, postStatus }
    );
    return data.posts;
  },
});
