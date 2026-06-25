/**
 * importCommon.ts — shared bits for the import tools (import_from_github +
 * get_import_status). The backend tracks an `Import` row per job; we surface its
 * id so the caller can poll, and normalize the backend status to a small, stable
 * vocabulary the model can reason about.
 */

/** An import job row as returned by the `import`/`imports` GraphQL queries. */
export interface ImportRow {
  id: string;
  status: string;
  source: string;
  message: string | null;
  is_continuous: boolean;
  created_at: string;
}

/** GraphQL to list a project's import jobs (used to find the freshly-created one). */
export const IMPORTS_QUERY = `query Imports($project_id: ID!) {
  imports(project_id: $project_id) { id status source message is_continuous created_at }
}`;

/**
 * Normalize the backend status to a stable, pollable vocabulary:
 *   init | retry -> pending      (queued / waiting to run again)
 *   running      -> in_progress
 *   finished     -> completed
 * NB: the backend has no terminal "failed" state — a failure goes back to
 * `retry` with the reason in `message`, so callers should read `message` when a
 * job stays pending across polls.
 */
export function normalizeImportStatus(status: string): "pending" | "in_progress" | "completed" {
  if (status === "running") return "in_progress";
  if (status === "finished") return "completed";
  return "pending"; // init | retry
}
