/**
 * get_import_status — Polls an import job (e.g. one started by
 * import_from_github). GitHub imports run in the background, so the caller polls
 * this until `state` is "completed".
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";
import { type ImportRow, normalizeImportStatus } from "./importCommon.js";

export default defineTool({
  name: "get_import_status",
  title: "Get Import Status",
  description:
    "Checks the status of an import job (started by import_from_github). Returns " +
    "state (pending | in_progress | completed) and the latest status message. " +
    "Poll this with the import_id from import_from_github until state is " +
    "'completed'. If it stays pending across polls, read `message` for the reason.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    import_id: z.string().describe("The import/job ID returned by import_from_github"),
  },
  handler: async ({ project_id, import_id }, { client }) => {
    const data = await client.graphql<{ import: ImportRow }>(
      `query GetImport($project_id: ID!, $import_id: ID!) {
         import(project_id: $project_id, import_id: $import_id) {
           id status source message is_continuous created_at
         }
       }`,
      { project_id, import_id },
    );
    const imp = data.import;
    return {
      import_id: imp.id,
      state: normalizeImportStatus(imp.status),
      raw_status: imp.status,
      source: imp.source,
      message: imp.message,
      is_continuous: imp.is_continuous,
      created_at: imp.created_at,
    };
  },
});
