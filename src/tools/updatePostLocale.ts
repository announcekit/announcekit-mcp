/**
 * update_post_locale — Writes the title/body for ONE locale of a post. The main
 * use case is adding translations: translate the content (yourself or via
 * improve_text) and store it under the target locale.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { ValidationError } from "../core/errors.js";

interface UpdateLocaleResult {
  updatePostLocale: boolean;
}

interface ProjectLocalesResult {
  project: { locales: Array<{ locale_id: string }> };
}

export default defineTool({
  name: "update_post_locale",
  title: "Update Post Locale",
  description:
    "Sets the title and body of a post for a specific locale — typically to add " +
    "or update a translation. The project must have the locale enabled. Read the " +
    "post first with get_post to see existing locales.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    post_id: z.string().describe("The post ID"),
    locale: z.string().describe("Target locale id, e.g. 'de', 'es', 'tr'"),
    title: z.string().describe("Title in the target language"),
    body: z.string().describe("Body in the target language (HTML supported)"),
  },
  handler: async ({ project_id, post_id, locale, title, body }, { client }) => {
    // Validate the locale before the mutation: the backend only accepts locales
    // already enabled on the project and otherwise throws an opaque
    // "Unrecognized project locale". Surface a clear, actionable error instead.
    const { project } = await client.graphql<ProjectLocalesResult>(
      `query ProjectLocales($project_id: ID!) {
         project(project_id: $project_id) { locales { locale_id } }
       }`,
      { project_id },
    );
    const available = project.locales.map((l) => l.locale_id);
    const matched = available.find((id) => id.toLowerCase() === locale.toLowerCase());
    if (!matched) {
      throw new ValidationError(
        `Locale '${locale}' is not enabled on this project. ` +
          `Available locales: ${available.length ? available.join(", ") : "(none)"}. ` +
          `Enable it in the project's locale settings first.`,
      );
    }

    const data = await client.graphql<UpdateLocaleResult>(
      `mutation UpdatePostLocale($project_id: ID!, $post_id: ID!, $locale_id: String!, $title: String!, $body: String!) {
         updatePostLocale(project_id: $project_id, post_id: $post_id, locale_id: $locale_id, title: $title, body: $body)
       }`,
      { project_id, post_id, locale_id: matched, title, body },
    );
    return { updated: data.updatePostLocale, post_id, locale: matched };
  },
});
