/**
 * reply_feature_request — Sends a reply to a feature request's subscribers.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  // external_user_id is the feature request's author. It's null when the request
  // is anonymous/team-authored, in which case there is no one to email.
  replyFeatureRequest: { id: string; external_user_id: string | null };
}

export default defineTool({
  name: "reply_feature_request",
  title: "Reply to Feature Request",
  description:
    "Sends a reply on a feature request (notifies its subscribers). Use this to " +
    "update voters, e.g. 'we shipped this'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    feature_request_id: z.string().describe("The feature request ID"),
    content: z.string().describe("Reply body"),
    subject: z.string().optional().describe("Reply subject (optional)"),
  },
  handler: async ({ project_id, feature_request_id, content, subject }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation ReplyFR($project_id:ID!,$feature_request_id:ID!,$content:String,$subject:String){
         replyFeatureRequest(project_id:$project_id,feature_request_id:$feature_request_id,content:$content,subject:$subject){ id external_user_id }
       }`,
      { project_id, feature_request_id, content, subject },
    );
    const notificationSent = Boolean(data.replyFeatureRequest.external_user_id);
    return {
      replied: true,
      feature_request_id: data.replyFeatureRequest.id,
      notification_sent: notificationSent,
      note: notificationSent
        ? "Reply saved and the feature request's author was notified by email."
        : "Reply saved. No notification was sent — this feature request has no external-user author to email.",
    };
  },
});
