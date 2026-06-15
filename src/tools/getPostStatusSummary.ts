/**
 * get_post_status_summary — Counts of live/scheduled/draft/expired posts created
 * in a date range. A quick project health overview.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface StatusResult {
  getPostStatus: { live: number; scheduled: number; draft: number; expired: number; total: number };
}

export default defineTool({
  name: "get_post_status_summary",
  title: "Post Status Summary",
  description:
    "Returns how many posts created in a date range are live, scheduled, draft, " +
    "and expired. Good for 'how is this month going?' style overviews.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    start_date: z.string().describe("Start date, YYYY-MM-DD"),
    end_date: z.string().describe("End date, YYYY-MM-DD"),
  },
  handler: async ({ project_id, start_date, end_date }, { client }) => {
    const data = await client.graphql<StatusResult>(
      `query PostStatusSummary($project_id: ID!, $date_range: DateRange!) {
         getPostStatus(project_id: $project_id, date_range: $date_range) {
           live
           scheduled
           draft
           expired
           total
         }
       }`,
      { project_id, date_range: { start_date, end_date } },
    );
    return data.getPostStatus;
  },
});
