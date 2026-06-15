/**
 * create_roadmap_item — Creates (or updates) a roadmap item under a status column.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  saveIssue: { id: string; title: string; status: { id: string; name: string } };
}

export default defineTool({
  name: "create_roadmap_item",
  title: "Create Roadmap Item",
  description:
    "Creates a roadmap item in a status column (or updates one if issue_id is " +
    "given). Use list_roadmap first to get valid status_id values.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    status_id: z.string().describe("The status/column ID (from list_roadmap)"),
    title: z.string().describe("Item title"),
    summary: z.string().optional().describe("Description (optional)"),
    due_at: z.string().optional().describe("Due date (YYYY-MM-DD, optional)"),
    labels: z.array(z.string()).optional().describe("Label IDs (optional)"),
    issue_id: z.string().optional().describe("Update an existing item instead of creating"),
  },
  handler: async ({ project_id, status_id, title, summary, due_at, labels, issue_id }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation SaveIssue($project_id:ID!,$issue_id:ID,$status_id:ID!,$title:String!,$summary:String,$due_at:Date,$labels:[ID!]){
         saveIssue(project_id:$project_id,issue_id:$issue_id,status_id:$status_id,title:$title,summary:$summary,due_at:$due_at,labels:$labels){
           id title status { id name }
         }
       }`,
      { project_id, issue_id, status_id, title, summary, due_at, labels },
    );
    return { saved: true, item: data.saveIssue };
  },
});
