/**
 * get_nps — Reads NPS health metrics (score, response counts, distribution) for
 * a post's NPS survey.
 *
 * Reads them via the post's `nps` field (a query, derived from the survey's
 * responses). The older getNps resolver only read a separate NPS *settings* row
 * and threw a generic "Not Found" when absent; calculateNps returns the same
 * metrics but is a mutation (not callable by read-scoped API tokens), so we use
 * the read-friendly post.nps field instead.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface NpsResult {
  post: {
    id: string;
    nps: {
      nps_score: number | null;
      promoters_percentage: number | null;
      detractor_percentage: number | null;
      passive_percentage: number | null;
      promoters_count: number | null;
      detractor_count: number | null;
      passive_count: number | null;
    } | null;
  } | null;
}

export default defineTool({
  name: "get_nps",
  title: "Get NPS Metrics",
  description:
    "Returns NPS health metrics for a post's survey: the NPS score, response counts " +
    "(promoters/passives/detractors) and the percentage distribution. Create an NPS " +
    "survey with create_post using type='nps'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID of the NPS survey"),
  },
  handler: async ({ project_id, post_id }, { client }) => {
    const { post } = await client.graphql<NpsResult>(
      `query GetNps($project_id: ID!, $post_id: ID!) {
         post(project_id: $project_id, post_id: $post_id) {
           id
           nps {
             nps_score
             promoters_percentage
             detractor_percentage
             passive_percentage
             promoters_count
             detractor_count
             passive_count
           }
         }
       }`,
      { project_id, post_id },
    );

    if (!post) {
      return { has_data: false, note: `Post ${post_id} was not found on project ${project_id}.` };
    }

    const s = post.nps;
    const total_responses = (s?.promoters_count ?? 0) + (s?.passive_count ?? 0) + (s?.detractor_count ?? 0);

    // No responses yet (or not an NPS survey) — surface a clear note, not zeros.
    if (!s || total_responses === 0) {
      return {
        has_data: false,
        note:
          "No NPS responses found for this post. Confirm it is an NPS survey " +
          "(created with type='nps') and has received responses.",
      };
    }

    return {
      has_data: true,
      nps_score: s.nps_score,
      total_responses,
      responses: {
        promoters: s.promoters_count,
        passives: s.passive_count,
        detractors: s.detractor_count,
      },
      distribution_percentage: {
        promoters: s.promoters_percentage,
        passives: s.passive_percentage,
        detractors: s.detractor_percentage,
      },
    };
  },
});
