# AnnounceKit MCP Server

Connect AI clients (Claude, ChatGPT, Cursor, …) to [AnnounceKit](https://announcekit.app)
over the [Model Context Protocol](https://modelcontextprotocol.io). Manage posts,
view stats, triage feedback and feature requests, work the roadmap — all through
AnnounceKit's GraphQL API, scoped to a single project by an access token.

It runs two ways:

- **Local (stdio):** run it on your machine with your own token — great for a
  personal setup in Claude Desktop / Cursor / Claude Code.
- **Hosted (HTTP):** point your client at our hosted endpoint and pass your token
  as a header — nothing to install.

This server is **read + create/update only**. It exposes **no delete or other
destructive operations**; those stay dashboard-only by design.

---

## Get a token

Create a project-scoped access token in AnnounceKit:
**Settings → API Tokens** (owner/manager only). Tokens look like `ak_pat_…` and
carry a scope:

| Scope   | Can do                                            |
| ------- | ------------------------------------------------- |
| `read`  | queries only (the 15 read tools)                  |
| `write` | read + create/update (all 29 tools, no deletes)   |

A token acts on behalf of its creator; if that member loses access to the
project, the token stops working — recreate it to replace.

---

## Use it hosted (no install)

Point your client at the hosted endpoint and pass your token as a Bearer header.
For Claude Code:

```bash
claude mcp add --transport http announcekit https://mcp.announcekit.app/mcp \
  --header "Authorization: Bearer ak_pat_…"
```

Any MCP client that supports Streamable HTTP works the same way — set the URL and
the `Authorization: Bearer` header.

---

## Use it locally (stdio)

Requires **Node 22+**.

```bash
npm install -g announcekit-mcp     # or: npx announcekit-mcp
```

Register it with your client. Example for Claude Code:

```bash
claude mcp add announcekit \
  --env ANNOUNCEKIT_TOKEN=ak_pat_… \
  -- announcekit-mcp
```

### Environment variables

| Variable                  | Required | Default                     | Notes                                          |
| ------------------------- | -------- | --------------------------- | ---------------------------------------------- |
| `ANNOUNCEKIT_TOKEN`       | yes      | —                           | your `ak_pat_…` access token                   |
| `ANNOUNCEKIT_API_URL`     | no       | `https://announcekit.app`   | override for self-hosted / staging             |
| `ANNOUNCEKIT_GRAPHQL_PATH`| no       | `/gq/v2`                    | GraphQL path                                   |

See [.env.example](.env.example).

---

## Tools (29)

**Read (15):** `list_projects`, `list_labels`, `list_posts`, `get_post`,
`list_post_templates`, `get_post_stats`, `get_post_status_summary`,
`list_feedback`, `list_activities`, `get_nps`, `list_segments`,
`list_external_users`, `list_feeds`, `list_feature_requests`, `list_roadmap`

**Write / create / update (14):** `save_label`, `create_post`, `update_post`,
`publish_post`, `schedule_post`, `update_post_locale`, `save_post_template`,
`generate_post_draft`, `improve_text`, `create_feature_request`,
`comment_feature_request`, `reply_feature_request`, `create_roadmap_item`,
`create_roadmap_status`

A `read` token exposes the 15 read tools; a `write` token exposes all 29.

---

## Develop

Requires **Node 24** to build.

```bash
npm install
npm run build           # tsc -> dist/
npm run dev             # stdio entry, watch (tsx)
npm run dev:http        # hosted HTTP entry on :8080
npm run typecheck
```

Architecture: TypeScript, ESM, isolated package (no main-product code). Layered,
one tool per file under `src/tools/`. Two entry points share one `buildServer()`
factory — `src/index.ts` (stdio, one token from env) and `src/http.ts` (hosted,
per-request Bearer token, stateless).

Adding a tool = one file under `src/tools/` + one line in `src/tools/index.ts`.

### Running the hosted variant

`Dockerfile` builds the hosted image: it runs `dist/http.js`, listens on
`:8080`, and serves `GET /health` for load-balancer / container probes. It reads
`ANNOUNCEKIT_API_URL` (defaults to production) and `PORT` from the environment;
each request authenticates with its own `Authorization: Bearer` token, so the
process is stateless and scales horizontally.

```bash
docker build -t announcekit-mcp .
docker run -p 8080:8080 -e ANNOUNCEKIT_API_URL=https://announcekit.app announcekit-mcp
```

---

## License

MIT
