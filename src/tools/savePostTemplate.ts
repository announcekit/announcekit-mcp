/**
 * save_post_template — Creates (or updates) a reusable post template.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  savePostTemplate: { id: string; title: string };
}

export default defineTool({
  name: "save_post_template",
  title: "Save Post Template",
  description:
    "Creates a reusable post template (or updates one if post_template_id is given).",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    title: z.string().describe("Template title"),
    body: z.string().describe("Template body (HTML supported)"),
    post_template_id: z.string().optional().describe("Update an existing template instead of creating"),
  },
  handler: async ({ project_id, title, body, post_template_id }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation SaveTemplate($project_id:ID!,$post_template_id:ID,$title:String!,$body:String!){
         savePostTemplate(project_id:$project_id,post_template_id:$post_template_id,title:$title,body:$body){ id title }
       }`,
      { project_id, post_template_id, title, body },
    );
    return { saved: true, template: data.savePostTemplate };
  },
});
