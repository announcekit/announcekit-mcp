/**
 * list_roadmap — Lists the product roadmap: status columns and their items.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface RoadmapResult {
  statuses: Array<{ id: string; name: string; color: string }>;
  issues: {
    count: number;
    page: number;
    pages: number;
    list: Array<{
      id: string;
      title: string;
      summary: string | null;
      due_at: string | null;
      status: { id: string; name: string };
    }>;
  };
}

export default defineTool({
  name: "list_roadmap",
  title: "List Roadmap",
  description:
    "Lists the project's product roadmap: the status columns (e.g. Planned / In " +
    "Progress / Done) and the items in them with due dates.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    page: z.number().int().min(0).optional().describe("Page number, starting at 0"),
  },
  handler: async ({ project_id, page }, { client }) => {
    const data = await client.graphql<RoadmapResult>(
      `query ListRoadmap($project_id: ID!, $page: Int) {
         statuses(project_id: $project_id) { id name color }
         issues(project_id: $project_id, page: $page) {
           count
           page
           pages
           list {
             id
             title
             summary
             due_at
             status { id name }
           }
         }
       }`,
      { project_id, page },
    );
    return { statuses: data.statuses, items: data.issues };
  },
});
