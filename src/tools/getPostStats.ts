/**
 * get_post_stats — Post performance statistics (views, clicks).
 * Over a date range; an optional post_id narrows it to a single post.
 *
 * On the backend, getPostStatistics fills in metrics/dimensions itself via
 * formatRequest — so we only provide the project, date range, and optional post_id.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface PostStatsResult {
  getPostStatistics: {
    start_date: string;
    end_date: string;
    headers: Array<{ name: string; type: string }>;
    rows: string[][];
  };
}

export default defineTool({
  name: "get_post_stats",
  title: "Post Statistics",
  description:
    "Returns performance statistics (views, clicks, etc.) for a project's " +
    "posts over a given date range. Pass post_id to scope it to a single post. " +
    "Good for questions like 'how did my posts perform last month?'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    start_date: z.string().describe("Start date, in YYYY-MM-DD format"),
    end_date: z.string().describe("End date, in YYYY-MM-DD format"),
    post_id: z.number().int().optional().describe("ID of a single post (optional; if omitted, all posts)"),
  },
  handler: async ({ project_id, start_date, end_date, post_id }, { client }) => {
    const data = await client.graphql<PostStatsResult>(
      `query PostStats($input: AnalyticsInput!) {
         getPostStatistics(input: $input) {
           start_date
           end_date
           headers { name type }
           rows
         }
       }`,
      {
        input: {
          project_id,
          start_date,
          end_date,
          post_id: post_id !== undefined ? [post_id] : undefined,
        },
      }
    );
    return data.getPostStatistics;
  },
});
