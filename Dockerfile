# Hosted AnnounceKit MCP server (Streamable HTTP).
# Multi-stage: build TypeScript, then ship a slim runtime image.

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist

# Run unprivileged (the `node` user ships with the image, uid 1000). Matches the
# k8s securityContext (runAsNonRoot + readOnlyRootFilesystem) — the app writes
# nothing to disk.
USER node

# The hosted variant listens on HTTP (per-request token auth).
EXPOSE 8080
CMD ["node", "dist/http.js"]
