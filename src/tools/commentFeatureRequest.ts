/**
 * comment_feature_request — Adds an internal comment to a feature request,
 * optionally changing its status.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  commentFeatureRequest: { id: string };
}

export default defineTool({
  name: "comment_feature_request",
  title: "Comment on Feature Request",
  description:
    "Adds a comment to a feature request and optionally sets its status. Use " +
    "reply_feature_request to send a message to its subscribers instead.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    feature_request_id: z.string().describe("The feature request ID"),
    content: z.string().describe("Comment text"),
    status: z.string().optional().describe("New status name (optional)"),
  },
  handler: async ({ project_id, feature_request_id, content, status }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation CommentFR($project_id:ID!,$feature_request_id:ID!,$content:String!,$status:String){
         commentFeatureRequest(project_id:$project_id,feature_request_id:$feature_request_id,content:$content,status:$status){ id }
       }`,
      { project_id, feature_request_id, content, status },
    );
    return { commented: true, feature_request_id: data.commentFeatureRequest.id };
  },
});
