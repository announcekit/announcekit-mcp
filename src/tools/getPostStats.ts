/**
 * get_post_stats — Per-post performance statistics (views, link clicks,
 * reactions, feedback) for a project over a date range.
 *
 * Mirrors the dashboard's "Top Performing Posts" call: getPostStatistics only
 * produces per-post rows when asked for the post_id dimension (the backend maps
 * each row's post_id to a title). Without it, the backend falls back to an
 * event_date report that has no post titles, so we always request post_id here.
 */

import { z } from "zod";
import { defineTool } from "../core/tool.js";

interface PostStatsResult {
  getPostStatistics: {
    start_date: string;
    end_date: string;
    headers: Array<{ name: string; type: string }>;
    rows: string[][];
  };
}

const MAX_RANGE_MONTHS = 6;

/** Formats a Date as YYYY-MM-DD (UTC). */
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Resolves the date range: defaults to the last 30 days when unset, and clamps
 * the start forward so the window never exceeds 6 months (these are full-scan
 * Redshift aggregates and a wider range is slow). Returns a note when clamped.
 */
function resolveRange(start_date?: string, end_date?: string): { start: string; end: string; note?: string } {
  const end = end_date ? new Date(end_date) : new Date();
  const start = start_date ? new Date(start_date) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

  const maxStart = new Date(end);
  maxStart.setUTCMonth(maxStart.getUTCMonth() - MAX_RANGE_MONTHS);

  if (start < maxStart) {
    return {
      start: toYmd(maxStart),
      end: toYmd(end),
      note: `Date range was limited to the most recent ${MAX_RANGE_MONTHS} months for performance.`,
    };
  }
  return { start: toYmd(start), end: toYmd(end) };
}

export default defineTool({
  name: "get_post_stats",
  title: "Post Statistics",
  description:
    "Returns per-post performance statistics (views, link clicks, reactions, feedback) for " +
    "a project's posts over a date range, ranked by views. Dates default to the last 30 days " +
    "and the range is capped at 6 months. Pass post_id to return just that post's stats. " +
    "Good for 'how did my posts perform last month?'.",
  inputSchema: {
    project_id: z.string().describe("The project ID"),
    start_date: z.string().optional().describe("Start date YYYY-MM-DD (optional; defaults to 30 days ago)"),
    end_date: z.string().optional().describe("End date YYYY-MM-DD (optional; defaults to today)"),
    post_id: z.number().int().optional().describe("Return only this post's stats (optional)"),
  },
  handler: async ({ project_id, start_date, end_date, post_id }, { client }) => {
    const { start, end, note } = resolveRange(start_date, end_date);

    const data = await client.graphql<PostStatsResult>(
      `query PostStats($input: AnalyticsInput!) {
         getPostStatistics(input: $input) {
           start_date
           end_date
           headers { name type }
           rows
         }
       }`,
      {
        input: {
          project_id,
          start_date: start,
          end_date: end,
          // Per-post breakdown: the backend maps post_id -> title for these rows.
          dimensions: ["post_id"],
          metrics: ["unique"],
          event_type: ["post-view", "post-linkclick", "post-reaction", "post-feedback"],
          sort_by: "unique",
          sort_desc: true,
          // When a single post is requested, widen the window so it is included.
          limit: post_id !== undefined ? 1000 : 50,
        },
      }
    );

    const report = data.getPostStatistics;
    const col = (name: string) => report.headers.findIndex((h) => h.name === name);
    const iViews = col("unique");
    const iLinkClicks = col("post_linkclick_count");
    const iReactions = col("post_reaction_count");
    const iFeedback = col("post_feedback_count");
    const iPostId = col("post_id");
    // mapReportPostsTitle appends the title one column past the selected headers.
    const iTitle = report.headers.length;

    const num = (v: string | undefined) => (v == null ? 0 : parseInt(v, 10) || 0);

    let posts = report.rows.map((row) => ({
      post_id: row[iPostId],
      title: row[iTitle] ?? null,
      views: num(row[iViews]),
      link_clicks: num(row[iLinkClicks]),
      reactions: num(row[iReactions]),
      feedback: num(row[iFeedback]),
    }));

    if (post_id !== undefined) {
      posts = posts.filter((p) => p.post_id === String(post_id));
    }

    return {
      start_date: report.start_date,
      end_date: report.end_date,
      posts,
      ...(note ? { note } : {}),
    };
  },
});
