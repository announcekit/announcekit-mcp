/**
 * list_labels — Lists the labels in a project.
 * Label IDs are taken from here when assigning labels while creating a post.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface LabelsResult {
  labels: Array<{ id: string; name: string; color: string }>;
}

export default defineTool({
  name: "list_labels",
  title: "List Labels",
  description: "Lists the labels in a project. Use the IDs from here to decide which " + "label to assign when creating a post.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
  },
  handler: async ({ project_id }, { client }) => {
    const data = await client.graphql<LabelsResult>(
      `query ListLabels($project_id: ID!) {
         labels(project_id: $project_id) { id name color }
       }`,
      { project_id }
    );
    return { count: data.labels.length, labels: data.labels };
  },
});
