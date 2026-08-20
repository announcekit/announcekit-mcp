/**
 * list_widgets — Lists the project's widgets, so a post can be targeted at one.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface WidgetsResult {
  widgets: Array<{
    id: string;
    name: string;
    slug: string;
    mode: string;
    type: string | null;
    layout: string | null;
  }>;
}

export default defineTool({
  name: "list_widgets",
  title: "List Widgets",
  description:
    "Lists the widgets in a project (the in-app announcement widgets embedded in " +
    "a product). Use it to find a widget id before limiting a post to specific " +
    "widgets via create_post/update_post, or to read back which widget a post targets.",
  inputSchema: {
    project_id: z.string().describe("The project ID (from list_projects)"),
  },
  handler: async ({ project_id }, { client }) => {
    const data = await client.graphql<WidgetsResult>(
      `query ListWidgets($project_id: ID!) {
         widgets(project_id: $project_id) {
           id
           name
           slug
           mode
           type
           layout
         }
       }`,
      { project_id },
    );
    return { count: data.widgets.length, widgets: data.widgets };
  },
});
