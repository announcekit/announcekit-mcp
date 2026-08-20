/**
 * get_post — Reads a single post in full detail (all locales, labels, dates).
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { summarizeTargeting } from "./widgetTargeting.js";

interface PostResult {
  widgets: Array<{ id: string; name: string }>;
  post: {
    id: string;
    status: string | null;
    is_draft: boolean;
    is_pinned: boolean;
    created_at: string;
    visible_at: string;
    expire_at: string | null;
    external_url: string | null;
    segment_filters: string | null;
    labels: Array<{ label: { id: string; name: string } }>;
    contents: Array<{
      locale_id: string;
      title: string;
      body: string;
      summary: string | null;
      url: string;
    }>;
  };
}

export default defineTool({
  name: "get_post",
  title: "Get Post",
  description:
    "Reads a single post in full detail: status, dates, labels, which widgets it " +
    "is limited to, and the title/body for every locale. Use before editing, " +
    "translating, or reviewing a post.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID (from list_posts)"),
  },
  handler: async ({ project_id, post_id }, { client }) => {
    const data = await client.graphql<PostResult>(
      `query GetPost($project_id: ID!, $post_id: ID!) {
         post(project_id: $project_id, post_id: $post_id) {
           id
           status
           is_draft
           is_pinned
           created_at
           visible_at
           expire_at
           external_url
           segment_filters
           labels { label { id name } }
           contents { locale_id title body summary url }
         }
         widgets(project_id: $project_id) { id name }
       }`,
      { project_id, post_id },
    );
    const { segment_filters, ...p } = data.post;
    return {
      ...p,
      labels: p.labels.map((l) => l.label),
      targeting: summarizeTargeting(segment_filters, data.widgets),
    };
  },
});
