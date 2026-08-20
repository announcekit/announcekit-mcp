/**
 * Shared helpers for tools that update an existing post via savePost.
 *
 * savePost upserts the provided fields, but `contents` is required — so any
 * update must send the post's content back. We fetch the current post first and
 * preserve everything the caller didn't explicitly change.
 *
 * `flags` has to be sent back explicitly: the API rebuilds a post's booster
 * flags from what the request carries, so omitting the field clears the
 * pop-up/notification/bar boosters configured on that post.
 */

import type { AnnouncekitClient } from "../client/announcekitClient.js";

export interface ExistingPost {
  id: string;
  is_draft: boolean;
  is_pinned: boolean;
  visible_at: string;
  expire_at: string | null;
  status: string | null;
  flags: string[];
  /** Audience rule as a JSON string; an unset value can arrive as "null". */
  segment_filters: string | null;
  labels: Array<{ label: { id: string } }>;
  contents: Array<{ locale_id: string; title: string; body: string; summary: string | null }>;
}

export async function fetchPost(
  client: AnnouncekitClient,
  project_id: string,
  post_id: string,
): Promise<ExistingPost> {
  const data = await client.graphql<{ post: ExistingPost }>(
    `query GetPostForUpdate($project_id: ID!, $post_id: ID!) {
       post(project_id: $project_id, post_id: $post_id) {
         id
         is_draft
         is_pinned
         visible_at
         expire_at
         status
         flags
         segment_filters
         labels { label { id } }
         contents { locale_id title body summary }
       }
     }`,
    { project_id, post_id },
  );
  return data.post;
}

/** savePost variables that keep the post exactly as it is. */
export function preservedVars(p: ExistingPost) {
  return {
    post_id: p.id,
    contents: p.contents.map((c) => ({
      locale_id: c.locale_id,
      title: c.title,
      body: c.body,
      summary: c.summary ?? undefined,
    })),
    is_draft: p.is_draft,
    is_pinned: p.is_pinned,
    visible_at: p.visible_at,
    expire_at: p.expire_at ?? undefined,
    labels: p.labels.map((l) => l.label.id),
    // Send the current flags back, or the post loses its configured boosters.
    flags: p.flags ?? [],
    // Omitted when the post has no targeting, so we never write a value the
    // post did not already have.
    segment_filters: p.segment_filters ?? undefined,
  };
}

export const SAVE_POST_MUTATION = `
  mutation SavePost(
    $project_id: ID!
    $post_id: ID
    $contents: [PostContentInput!]!
    $is_draft: Boolean
    $is_pinned: Boolean
    $visible_at: Date
    $expire_at: Date
    $labels: [ID!]
    $flags: [String!]
    $segment_filters: JSONObject
  ) {
    savePost(
      project_id: $project_id
      post_id: $post_id
      contents: $contents
      is_draft: $is_draft
      is_pinned: $is_pinned
      visible_at: $visible_at
      expire_at: $expire_at
      labels: $labels
      flags: $flags
      segment_filters: $segment_filters
    ) {
      id
      status
      is_draft
      visible_at
    }
  }`;

export interface SavePostResult {
  savePost: { id: string; status: string | null; is_draft: boolean; visible_at: string };
}
