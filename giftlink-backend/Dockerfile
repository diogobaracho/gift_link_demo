# syntax=docker/dockerfile:1.7
# GiftLink API - multi-stage build. Build context: repository root.
#   docker build -f giftlink-backend/Dockerfile -t giftlink-backend .

ARG NODE_VERSION=24

# ---- base: shared settings ----------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    SCARF_ANALYTICS=false
WORKDIR /app
# The lockfile references every workspace, so all manifests must be present for `npm ci`.
COPY package.json package-lock.json ./
COPY giftlink-backend/package.json giftlink-backend/
COPY giftlink-frontend/package.json giftlink-frontend/
COPY sentiment/package.json sentiment/

# ---- deps: all dependencies (build + dev mode) -------------------------------------
FROM base AS deps
RUN npm ci --workspace giftlink-backend --ignore-scripts

# ---- dev: hot reload, sources bind-mounted by docker-compose.dev.yml -----------------
FROM deps AS dev
COPY tsconfig.base.json ./
COPY giftlink-backend giftlink-backend
WORKDIR /app/giftlink-backend
EXPOSE 3060
CMD ["npx", "tsx", "watch", "src/server.ts"]

# ---- build: compile TypeScript ---------------------------------------------------------
FROM deps AS build
COPY tsconfig.base.json ./
COPY giftlink-backend giftlink-backend
RUN npm run build --workspace giftlink-backend

# ---- prod-deps: runtime dependencies only ----------------------------------------------
FROM base AS prod-deps
RUN npm ci --workspace giftlink-backend --omit=dev --ignore-scripts \
    # Version conflicts nest some packages under the workspace; make the path always exist.
    && mkdir -p giftlink-backend/node_modules

# ---- runtime: minimal, non-root --------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3060
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/giftlink-backend/node_modules ./giftlink-backend/node_modules
COPY --from=build --chown=node:node /app/giftlink-backend/dist ./giftlink-backend/dist
COPY --chown=node:node giftlink-backend/package.json ./giftlink-backend/
COPY --chown=node:node giftlink-backend/data ./giftlink-backend/data
WORKDIR /app/giftlink-backend
USER node
EXPOSE 3060
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3060)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Run node directly (not npm) so SIGTERM reaches the process for graceful shutdown.
CMD ["node", "dist/src/server.js"]
