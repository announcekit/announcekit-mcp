/**
 * create_post — Creates a new post (announcement) in a project.
 *
 * Safety: defaults to is_draft=true, so the AI prepares the post and the user
 * reviews/publishes it from the Announcekit UI. Uses the existing savePost
 * mutation, which keeps all server-side logic (plan limits, auth, audit log,
 * cache invalidation) intact.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface ProjectLocaleResult {
  project: { locale: string };
}

interface SavePostResult {
  savePost: {
    id: string;
    status: string | null;
    is_draft: boolean;
    visible_at: string;
  };
}

export default defineTool({
  name: "create_post",
  title: "Create Post",
  description:
    "Creates a new post (announcement) in a project. By default it is saved as " +
    "a DRAFT so the user can review and publish it from the Announcekit UI. " +
    "Supports an optional locale (defaults to the project's default locale), " +
    "labels, and scheduling via visible_at. Only set is_draft=false to publish " +
    "immediately when the user explicitly asks to.",
  inputSchema: {
    project_id: z.string().describe("The project ID (from list_projects)"),
    title: z.string().describe("Post title"),
    body: z.string().describe("Post body. HTML is supported (e.g. <p>...</p>, <ul><li>...)."),
    summary: z.string().optional().describe("Short summary (optional)"),
    locale: z.string().optional().describe("Locale id, e.g. 'en'. If omitted, the project's default locale is used."),
    is_draft: z.boolean().optional().describe("Save as draft. Defaults to true (recommended)."),
    labels: z.array(z.string()).optional().describe("Label IDs to assign (from list_labels)."),
    visible_at: z.string().optional().describe("Schedule the visibility date (YYYY-MM-DD). If omitted, the post becomes visible now when published."),
    type: z
      .enum(["post", "notification", "nps"])
      .optional()
      .describe("Post kind: 'post' (default, changelog), 'notification' (in-app), or 'nps' (NPS survey). nps/notification may require a paid plan."),
  },
  handler: async ({ project_id, title, body, summary, locale, is_draft, labels, visible_at, type }, { client }) => {
    const draft = is_draft ?? true; // default: safe draft

    // Resolve the locale: use the provided one, otherwise the project's default.
    let localeId = locale;
    if (!localeId) {
      const p = await client.graphql<ProjectLocaleResult>(
        `query ProjectLocale($project_id: ID!) {
           project(project_id: $project_id) { locale }
         }`,
        { project_id }
      );
      localeId = p.project.locale;
    }

    const data = await client.graphql<SavePostResult>(
      `mutation CreatePost(
         $project_id: ID!
         $contents: [PostContentInput!]!
         $is_draft: Boolean
         $labels: [ID!]
         $visible_at: Date
         $type: String
       ) {
         savePost(
           project_id: $project_id
           contents: $contents
           is_draft: $is_draft
           labels: $labels
           visible_at: $visible_at
           type: $type
         ) {
           id
           status
           is_draft
           visible_at
         }
       }`,
      {
        project_id,
        contents: [{ locale_id: localeId, title, body, summary }],
        is_draft: draft,
        labels,
        visible_at,
        type,
      }
    );

    return {
      created: true,
      post: data.savePost,
      note: draft ? "Saved as DRAFT. Review and publish it from the Announcekit UI." : "Published.",
    };
  },
});
