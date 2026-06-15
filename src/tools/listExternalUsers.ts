/**
 * list_external_users — Lists the project's audience (end users who saw or
 * interacted with announcements).
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface ExternalUsersResult {
  externalUserCount: number;
  externalUsers: {
    page: number;
    pages: number;
    items: Array<{
      id: string;
      name: string | null;
      email: string | null;
      seen_at: string;
      created_at: string;
      is_following: boolean;
      is_anon: boolean;
    } | null>;
  };
}

export default defineTool({
  name: "list_external_users",
  title: "List Audience",
  description:
    "Lists the project's audience: end users who viewed or interacted with " +
    "announcements, with name/email (when known), last-seen date, and whether " +
    "they follow the changelog.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0"),
  },
  handler: async ({ project_id, page }, { client }) => {
    const data = await client.graphql<ExternalUsersResult>(
      `query ListAudience($project_id: ID!, $page: Int) {
         externalUserCount(project_id: $project_id)
         externalUsers(project_id: $project_id, page: $page) {
           page
           pages
           items {
             id
             name
             email
             seen_at
             created_at
             is_following
             is_anon
           }
         }
       }`,
      { project_id, page },
    );
    return { total: data.externalUserCount, ...data.externalUsers };
  },
});
