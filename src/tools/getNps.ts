/**
 * get_nps — Reads the NPS survey configuration attached to a post.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  getNps: {
    id: string;
    post_id: string;
    interaction: string;
    follow_up_question: string;
    skip_reason: boolean;
    options: unknown;
  };
}

export default defineTool({
  name: "get_nps",
  title: "Get NPS Survey",
  description:
    "Reads the NPS survey settings attached to a post (the follow-up question and " +
    "interaction options). Create an NPS survey with create_post using type='nps'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID of the NPS survey"),
  },
  handler: async ({ project_id, post_id }, { client }) => {
    const data = await client.graphql<Result>(
      `query GetNps($project_id:ID!,$post_id:ID!){
         getNps(project_id:$project_id,post_id:$post_id){ id post_id interaction follow_up_question skip_reason options }
       }`,
      { project_id, post_id },
    );
    return data.getNps;
  },
});
