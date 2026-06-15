/**
 * create_feature_request — Creates (or updates) a feature request.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface ProjectLocale {
  project: { locale: string };
}
interface SaveFRResult {
  saveFeatureRequest: { id: string; title: string };
}

export default defineTool({
  name: "create_feature_request",
  title: "Create Feature Request",
  description:
    "Creates a feature request in a project (or updates one if feature_request_id " +
    "is given). Optionally attach it to a roadmap item (issue_id) and labels, or " +
    "mark it internal/approved.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    title: z.string().describe("Feature request title"),
    summary: z.string().optional().describe("Longer description (optional)"),
    locale: z.string().optional().describe("Locale id; defaults to the project's locale"),
    feature_request_id: z.string().optional().describe("Update an existing request instead of creating"),
    issue_id: z.string().optional().describe("Link to a roadmap item"),
    labels: z.array(z.string()).optional().describe("Label IDs"),
    is_internal: z.boolean().optional().describe("Internal-only (not shown publicly)"),
    is_approved: z.boolean().optional().describe("Mark as approved"),
  },
  handler: async (args, { client }) => {
    let localeId = args.locale;
    if (!localeId) {
      const p = await client.graphql<ProjectLocale>(
        `query L($project_id: ID!){ project(project_id:$project_id){ locale } }`,
        { project_id: args.project_id },
      );
      localeId = p.project.locale;
    }
    const data = await client.graphql<SaveFRResult>(
      `mutation CreateFR($project_id:ID!,$feature_request_id:ID,$issue_id:ID,$title:String!,$summary:String,$labels:[ID!],$is_internal:Boolean,$is_approved:Boolean,$contents:[FeatureRequestContentInput!]!){
         saveFeatureRequest(project_id:$project_id,feature_request_id:$feature_request_id,issue_id:$issue_id,title:$title,summary:$summary,labels:$labels,is_internal:$is_internal,is_approved:$is_approved,contents:$contents){ id title }
       }`,
      {
        project_id: args.project_id,
        feature_request_id: args.feature_request_id,
        issue_id: args.issue_id,
        title: args.title,
        summary: args.summary,
        labels: args.labels,
        is_internal: args.is_internal,
        is_approved: args.is_approved,
        contents: [{ locale_id: localeId, title: args.title, summary: args.summary }],
      },
    );
    return { saved: true, feature_request: data.saveFeatureRequest };
  },
});
