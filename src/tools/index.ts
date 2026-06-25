/**
 * tools/index.ts — THE TOOL REGISTRY LIST.
 *
 * The only place you touch when adding a new tool (besides its own file):
 *   1) write the file under tools/ (export default defineTool({...}))
 *   2) import it here and add it to allTools
 *
 * Policy: the MCP server exposes NO delete/destructive operations — only read,
 * create, and update. Deletions are intentionally dashboard-only.
 */

import type { AnyToolDefinition } from "../core/tool.js";

// projects & labels
import listProjects from "./listProjects.js";
import listLabels from "./listLabels.js";
import saveLabel from "./saveLabel.js";

// post lifecycle (no deletes)
import listPosts from "./listPosts.js";
import getPost from "./getPost.js";
import createPost from "./createPost.js";
import updatePost from "./updatePost.js";
import publishPost from "./publishPost.js";
import schedulePost from "./schedulePost.js";
import updatePostLocale from "./updatePostLocale.js";

// post templates
import listPostTemplates from "./listPostTemplates.js";
import savePostTemplate from "./savePostTemplate.js";

// AI helpers (server-side AnnounceKit AI)
import generatePostDraft from "./generatePostDraft.js";
import improveText from "./improveText.js";

// insight & stats
import getPostStats from "./getPostStats.js";
import getPostStatusSummary from "./getPostStatusSummary.js";
import listFeedback from "./listFeedback.js";
import listActivities from "./listActivities.js";
import getNps from "./getNps.js";

// audience & targeting
import listSegments from "./listSegments.js";
import listExternalUsers from "./listExternalUsers.js";

// feeds
import listFeeds from "./listFeeds.js";

// feature requests (no deletes/merge)
import listFeatureRequests from "./listFeatureRequests.js";
import createFeatureRequest from "./createFeatureRequest.js";
import commentFeatureRequest from "./commentFeatureRequest.js";
import replyFeatureRequest from "./replyFeatureRequest.js";

// roadmap (no deletes)
import listRoadmap from "./listRoadmap.js";
import createRoadmapItem from "./createRoadmapItem.js";
import createRoadmapStatus from "./createRoadmapStatus.js";

// imports
import importFromGithub from "./importFromGithub.js";
import getImportStatus from "./getImportStatus.js";

export const allTools: AnyToolDefinition[] = [
  // projects & labels
  listProjects,
  listLabels,
  saveLabel,
  // post lifecycle
  listPosts,
  getPost,
  createPost,
  updatePost,
  publishPost,
  schedulePost,
  updatePostLocale,
  // templates
  listPostTemplates,
  savePostTemplate,
  // AI
  generatePostDraft,
  improveText,
  // insight
  getPostStats,
  getPostStatusSummary,
  listFeedback,
  listActivities,
  getNps,
  // audience
  listSegments,
  listExternalUsers,
  // feeds
  listFeeds,
  // feature requests
  listFeatureRequests,
  createFeatureRequest,
  commentFeatureRequest,
  replyFeatureRequest,
  // roadmap
  listRoadmap,
  createRoadmapItem,
  createRoadmapStatus,
  // imports
  importFromGithub,
  getImportStatus,
];
