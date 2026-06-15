/**
 * import_from_github — Starts an async import of changelog posts from a GitHub
 * repo's releases. The killer changelog workflow: code releases -> announcements.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface Result {
  importGitHub: { type: string; message: string | null };
}

export default defineTool({
  name: "import_from_github",
  title: "Import from GitHub",
  description:
    "Starts a background job that imports posts from a GitHub repository's " +
    "releases. Imported posts default to drafts so they can be reviewed. Enable " +
    "continuous to keep syncing future releases. Posts appear a few minutes later.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    url: z.string().describe("GitHub repository URL, e.g. https://github.com/org/repo"),
    draft: z.boolean().optional().describe("Import as drafts (default true, recommended)"),
    continuous: z.boolean().optional().describe("Keep importing future releases (default false)"),
  },
  handler: async ({ project_id, url, draft, continuous }, { client }) => {
    const data = await client.graphql<Result>(
      `mutation ImportGitHub($project_id:ID!,$url:String!,$continuous:Boolean!,$draft:Boolean!){
         importGitHub(project_id:$project_id,url:$url,continuous:$continuous,draft:$draft){ type message }
       }`,
      { project_id, url, continuous: continuous ?? false, draft: draft ?? true },
    );
    return data.importGitHub;
  },
});
