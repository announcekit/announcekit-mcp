/**
 * list_segments — Lists the project's segment fields and saved segment profiles.
 * Needed when targeting a post with segment_filters.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface SegmentsResult {
  segments: string[];
  segmentProfiles: Array<{ title: string; rules: unknown }>;
}

export default defineTool({
  name: "list_segments",
  title: "List Segments",
  description:
    "Lists the audience segment fields and saved segment profiles of a project. " +
    "Use when the user wants to target an announcement to a specific audience.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
  },
  handler: async ({ project_id }, { client }) => {
    const data = await client.graphql<SegmentsResult>(
      `query ListSegments($project_id: ID!) {
         segments(project_id: $project_id)
         segmentProfiles(project_id: $project_id) { title rules }
       }`,
      { project_id },
    );
    return { segment_fields: data.segments, profiles: data.segmentProfiles };
  },
});
