/**
 * generate_post_draft — Generates announcement body text using AnnounceKit's
 * built-in server-side AI (autoGeneratePostContents). Returns the generated
 * HTML body; pair with create_post to save it as a draft.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface GenerateResult {
  autoGeneratePostContents: Array<{ body: string }>;
}

interface ProjectInfo {
  project: { name: string; locale: string };
}

export default defineTool({
  name: "generate_post_draft",
  title: "Generate Post Draft (AI)",
  description:
    "Generates announcement body text with AnnounceKit's built-in AI from a short " +
    "feature title. Returns the generated HTML body — review it, then use " +
    "create_post to save it as a draft. Good when the user says 'write an " +
    "announcement about X for me'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    title: z
      .string()
      .min(2)
      .describe("Short name of the feature/change to announce, e.g. 'Dark mode support'"),
    type: z
      .enum(["new-feature", "improvement", "bug-fix", "community-update"])
      .optional()
      .describe("Kind of announcement (default new-feature)"),
    tone: z.enum(["friendly", "formal"]).optional().describe("Writing tone (default friendly)"),
    product: z
      .string()
      .optional()
      .describe("Product name to mention. Defaults to the project's name."),
    locale: z.string().optional().describe("Locale id, e.g. 'en'. Defaults to the project's locale."),
  },
  handler: async ({ project_id, title, type, tone, product, locale }, { client }) => {
    let productName = product;
    let localeId = locale;
    if (!productName || !localeId) {
      const p = await client.graphql<ProjectInfo>(
        `query ProjectInfo($project_id: ID!) {
           project(project_id: $project_id) { name locale }
         }`,
        { project_id },
      );
      productName = productName || p.project.name;
      localeId = localeId || p.project.locale;
    }

    const data = await client.graphql<GenerateResult>(
      `mutation GenerateDraft($project_id: ID!, $locale_id: ID!, $type: String!, $options: JSONObject!) {
         autoGeneratePostContents(project_id: $project_id, locale_id: $locale_id, type: $type, options: $options) {
           body
         }
       }`,
      {
        project_id,
        locale_id: localeId,
        type: type ?? "new-feature",
        // JSONObject scalar parses its input with JSON.parse, so it must be a JSON string.
        options: JSON.stringify({ title, product: productName, tone: tone ?? "friendly" }),
      },
    );

    const body = data.autoGeneratePostContents.map((c) => c.body).join("");
    return {
      generated_body: body,
      note: "Review the text, then call create_post (is_draft stays true by default) to save it.",
    };
  },
});
