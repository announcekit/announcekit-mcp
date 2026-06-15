/**
 * list_post_templates — Lists reusable post templates in a project.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  postTemplates: Array<{ id: string; title: string; body: string }>;
}

export default defineTool({
  name: "list_post_templates",
  title: "List Post Templates",
  description: "Lists the project's reusable post templates (id, title, body).",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
  },
  handler: async ({ project_id }, { client }) => {
    const data = await client.graphql<Result>(
      `query PostTemplates($project_id:ID!){ postTemplates(project_id:$project_id){ id title body } }`,
      { project_id },
    );
    return { count: data.postTemplates.length, templates: data.postTemplates };
  },
});
