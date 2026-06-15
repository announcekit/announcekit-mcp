/**
 * create_roadmap_status — Creates (or updates) a roadmap status column.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  saveStatus: { id: string; name: string; color: string } | null;
}

export default defineTool({
  name: "create_roadmap_status",
  title: "Create Roadmap Status",
  description:
    "Creates a roadmap status column (e.g. 'Planned', 'In Progress', 'Done'), or " +
    "updates one if status_id is given.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    name: z.string().describe("Column name"),
    color: z.string().describe("Hex color without '#', e.g. '3B82F6'"),
    status_id: z.string().optional().describe("Update an existing status instead of creating"),
  },
  handler: async ({ project_id, name, color, status_id }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation SaveStatus($project_id:ID!,$status_id:ID,$name:String!,$color:String!){
         saveStatus(project_id:$project_id,status_id:$status_id,name:$name,color:$color){ id name color }
       }`,
      { project_id, status_id, name, color: color.replace(/^#/, "") },
    );
    return { saved: true, status: data.saveStatus };
  },
});
