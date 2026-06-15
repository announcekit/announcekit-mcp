/**
 * save_label — Creates (or updates) a label.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  saveLabel: { id: string; name: string; color: string } | null;
}

export default defineTool({
  name: "save_label",
  title: "Save Label",
  description:
    "Creates a label (or updates one if label_id is given). The `applies_to` " +
    "options control where the label can be used (posts, feature requests, roadmap).",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    name: z.string().describe("Label name"),
    color: z.string().describe("Hex color without '#', e.g. 'FF0000'"),
    label_id: z.string().optional().describe("Update an existing label instead of creating"),
    applies_to_posts: z.boolean().optional().describe("Usable on posts (default true)"),
    applies_to_feature_requests: z.boolean().optional().describe("Usable on feature requests (default true)"),
    applies_to_roadmap: z.boolean().optional().describe("Usable on roadmap items (default true)"),
  },
  handler: async (args, { client }) => {
    const data = await client.graphql<Result>(
      `mutation SaveLabel($project_id:ID!,$label_id:ID,$name:String!,$color:String!,$options:JSONObject!){
         saveLabel(project_id:$project_id,label_id:$label_id,name:$name,color:$color,options:$options){ id name color }
       }`,
      {
        project_id: args.project_id,
        label_id: args.label_id,
        name: args.name,
        color: args.color.replace(/^#/, ""),
        // JSONObject scalar parses its input with JSON.parse, so it must be a JSON string.
        options: JSON.stringify({
          post: args.applies_to_posts ?? true,
          feature_request: args.applies_to_feature_requests ?? true,
          roadmap: args.applies_to_roadmap ?? true,
        }),
      },
    );
    return { saved: true, label: data.saveLabel };
  },
});
