/**
 * import_from_github — Starts an async import of changelog posts from a GitHub
 * repo's releases. The killer changelog workflow: code releases -> announcements.
 *
 * The backend mutation only returns a Result (no id), so to give the caller a
 * pollable job id we snapshot the project's GitHub import rows before the
 * mutation and return the one that appears after. Poll it with get_import_status.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { type ImportRow, IMPORTS_QUERY, normalizeImportStatus } from "./importCommon.js";

interface Result {
  importGitHub: { type: string; message: string | null };
}

export default defineTool({
  name: "import_from_github",
  title: "Import from GitHub",
  description:
    "Starts a background job that imports posts from a GitHub repository's " +
    "releases. Imported posts default to drafts so they can be reviewed. Enable " +
    "continuous to keep syncing future releases. Returns an import_id — poll it " +
    "with get_import_status until the import completes (posts appear a few minutes later).",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    url: z.string().describe("GitHub repository URL, e.g. https://github.com/org/repo"),
    draft: z.boolean().optional().describe("Import as drafts (default true, recommended)"),
    continuous: z.boolean().optional().describe("Keep importing future releases (default false)"),
  },
  handler: async ({ project_id, url, draft, continuous }, { client }) => {
    // Snapshot existing GitHub import ids so we can identify the one we create.
    const before = await client.graphql<{ imports: ImportRow[] }>(IMPORTS_QUERY, { project_id });
    const knownGithubIds = new Set((before.imports ?? []).filter((i) => i.source === "github").map((i) => i.id));

    const data = await client.graphql<Result>(
      `mutation ImportGitHub($project_id:ID!,$url:String!,$continuous:Boolean!,$draft:Boolean!){
         importGitHub(project_id:$project_id,url:$url,continuous:$continuous,draft:$draft){ type message }
       }`,
      { project_id, url, continuous: continuous ?? false, draft: draft ?? true },
    );

    // Find the import row the mutation just created (newest GitHub import not in
    // the pre-snapshot; fall back to the newest GitHub import if timing hides it).
    const after = await client.graphql<{ imports: ImportRow[] }>(IMPORTS_QUERY, { project_id });
    const githubImports = (after.imports ?? []).filter((i) => i.source === "github").sort((a, b) => Number(b.id) - Number(a.id));
    const job = githubImports.find((i) => !knownGithubIds.has(i.id)) ?? githubImports[0];

    return {
      ...data.importGitHub,
      import_id: job?.id ?? null,
      state: job ? normalizeImportStatus(job.status) : "pending",
      next: "Poll get_import_status with project_id and this import_id until state is 'completed'.",
    };
  },
});
