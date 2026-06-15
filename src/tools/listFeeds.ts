/**
 * list_feeds — Lists the project's changelog feeds (public pages).
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface FeedsResult {
  feeds: Array<{
    id: string;
    name: string;
    slug: string;
    url: string;
    custom_host: string | null;
    is_private: boolean;
    is_disabled: boolean;
  }>;
}

export default defineTool({
  name: "list_feeds",
  title: "List Feeds",
  description:
    "Lists the project's changelog feeds (the public pages where posts appear), " +
    "including their URLs and visibility.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
  },
  handler: async ({ project_id }, { client }) => {
    const data = await client.graphql<FeedsResult>(
      `query ListFeeds($project_id: ID!) {
         feeds(project_id: $project_id) {
           id
           name
           slug
           url
           custom_host
           is_private
           is_disabled
         }
       }`,
      { project_id },
    );
    return { count: data.feeds.length, feeds: data.feeds };
  },
});
