/**
 * list_feature_requests — Lists feature requests with vote/comment counts.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface FeatureRequestsResult {
  featureRequests: {
    count: number;
    page: number;
    pages: number;
    list: Array<{
      id: string;
      title: string;
      summary: string | null;
      created_at: string;
      is_archived: boolean;
      is_approved: boolean;
      stats: { votes: number; comments: number };
    }>;
  };
}

export default defineTool({
  name: "list_feature_requests",
  title: "List Feature Requests",
  description:
    "Lists the project's feature requests with vote and comment counts. Sort by " +
    "TOP (most votes), TRENDING, or NEW. Good for 'what do users want most?'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    sort_by: z.enum(["TOP", "TRENDING", "NEW"]).optional().describe("Sort order (default NEW)"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0"),
  },
  handler: async ({ project_id, sort_by, page }, { client }) => {
    const data = await client.graphql<FeatureRequestsResult>(
      `query ListFeatureRequests($project_id: ID!, $sort_by: FeatureRequestSortBy!, $page: Int) {
         featureRequests(project_id: $project_id, sort_by: $sort_by, page: $page) {
           count
           page
           pages
           list {
             id
             title
             summary
             created_at
             is_archived
             is_approved
             stats { votes comments }
           }
         }
       }`,
      { project_id, sort_by: sort_by ?? "NEW", page },
    );
    return data.featureRequests;
  },
});
