/**
 * update_post — Edits an existing post. Only the fields you pass change; the
 * rest (other locales, labels, dates, draft state) is preserved.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { fetchPost, preservedVars, SAVE_POST_MUTATION, SavePostResult } from "./postCommon.js";

export default defineTool({
  name: "update_post",
  title: "Update Post",
  description:
    "Edits an existing post (draft or live). Pass only what you want to change: " +
    "title/body/summary (for one locale), labels, visibility or expiry dates, or " +
    "pinned state. Everything else is preserved. Does NOT publish a draft — use " +
    "publish_post for that.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID to edit"),
    title: z.string().optional().describe("New title (for the target locale)"),
    body: z.string().optional().describe("New body, HTML supported (for the target locale)"),
    summary: z.string().optional().describe("New short summary (for the target locale)"),
    locale: z
      .string()
      .optional()
      .describe("Locale to apply title/body/summary to. Defaults to the post's first locale."),
    labels: z.array(z.string()).optional().describe("Replace labels with these label IDs"),
    visible_at: z.string().optional().describe("New visibility date (ISO or YYYY-MM-DD)"),
    expire_at: z.string().optional().describe("New expiry date (ISO or YYYY-MM-DD)"),
    is_pinned: z.boolean().optional().describe("Pin/unpin the post"),
  },
  handler: async (args, { client }) => {
    const post = await fetchPost(client, args.project_id, args.post_id);
    const vars: Record<string, unknown> & { contents: Array<Record<string, unknown>> } = {
      project_id: args.project_id,
      ...preservedVars(post),
    };

    if (args.title !== undefined || args.body !== undefined || args.summary !== undefined) {
      const localeId = args.locale ?? post.contents[0]?.locale_id;
      const current = post.contents.find((c) => c.locale_id === localeId);
      if (!current && (args.title === undefined || args.body === undefined)) {
        throw new Error(
          `Post has no '${localeId}' content yet — provide both title and body to create it.`,
        );
      }
      const merged = {
        locale_id: localeId,
        title: args.title ?? current!.title,
        body: args.body ?? current!.body,
        summary: args.summary ?? current?.summary ?? undefined,
      };
      vars.contents = [
        ...vars.contents.filter((c) => c.locale_id !== localeId),
        merged,
      ];
    }

    if (args.labels !== undefined) vars.labels = args.labels;
    if (args.visible_at !== undefined) vars.visible_at = args.visible_at;
    if (args.expire_at !== undefined) vars.expire_at = args.expire_at;
    if (args.is_pinned !== undefined) vars.is_pinned = args.is_pinned;

    const data = await client.graphql<SavePostResult>(SAVE_POST_MUTATION, vars);
    return { updated: true, post: data.savePost };
  },
});
