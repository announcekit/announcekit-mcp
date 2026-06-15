/**
 * publish_post — Takes a draft live (or re-publishes a paused/scheduled post now).
 * Kept as a separate explicit tool so publishing is always a deliberate action.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { fetchPost, preservedVars, SAVE_POST_MUTATION, SavePostResult } from "./postCommon.js";

export default defineTool({
  name: "publish_post",
  title: "Publish Post",
  description:
    "Publishes a draft post so it becomes live now. Only call this when the user " +
    "explicitly asks to publish. To publish at a future date use schedule_post instead.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID to publish"),
  },
  handler: async ({ project_id, post_id }, { client }) => {
    const post = await fetchPost(client, project_id, post_id);
    const vars = {
      project_id,
      ...preservedVars(post),
      is_draft: false,
      // A draft's visible_at may be in the past or future; "publish now" means now.
      visible_at: new Date().toISOString(),
    };
    const data = await client.graphql<SavePostResult>(SAVE_POST_MUTATION, vars);
    return { published: true, post: data.savePost };
  },
});
