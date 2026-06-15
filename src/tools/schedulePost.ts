/**
 * schedule_post — Schedules a post to go live at a future date/time.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { fetchPost, preservedVars, SAVE_POST_MUTATION, SavePostResult } from "./postCommon.js";

export default defineTool({
  name: "schedule_post",
  title: "Schedule Post",
  description:
    "Schedules a post to become visible at a future date/time (its status becomes " +
    "Scheduled). Use publish_post to go live immediately instead.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID to schedule"),
    visible_at: z
      .string()
      .describe("When the post should go live (ISO datetime or YYYY-MM-DD, in the future)"),
  },
  handler: async ({ project_id, post_id, visible_at }, { client }) => {
    const when = new Date(visible_at);
    if (isNaN(when.getTime())) throw new Error("Invalid visible_at date");
    if (when.getTime() <= Date.now()) {
      throw new Error("visible_at must be in the future — use publish_post to go live now.");
    }

    const post = await fetchPost(client, project_id, post_id);
    const vars = {
      project_id,
      ...preservedVars(post),
      is_draft: false,
      visible_at: when.toISOString(),
    };
    const data = await client.graphql<SavePostResult>(SAVE_POST_MUTATION, vars);
    return { scheduled: true, goes_live_at: when.toISOString(), post: data.savePost };
  },
});
