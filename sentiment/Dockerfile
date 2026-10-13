# syntax=docker/dockerfile:1.7
# GiftLink sentiment microservice. Build context: repository root.
#   docker build -f sentiment/Dockerfile -t giftlink-sentiment .

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS base
ENV NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false
WORKDIR /app
COPY package.json package-lock.json ./
COPY giftlink-backend/package.json giftlink-backend/
COPY giftlink-frontend/package.json giftlink-frontend/
COPY sentiment/package.json sentiment/

FROM base AS deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace sentiment --ignore-scripts

FROM deps AS dev
COPY tsconfig.base.json ./
COPY sentiment sentiment
WORKDIR /app/sentiment
EXPOSE 3000
CMD ["npx", "tsx", "watch", "src/server.ts"]

FROM deps AS build
COPY tsconfig.base.json ./
COPY sentiment sentiment
RUN npm run build --workspace sentiment

FROM base AS prod-deps
RUN --mount=type=cache,target=/root/.npm \
    npm ci --workspace sentiment --omit=dev --ignore-scripts \
    # Version conflicts nest some packages under the workspace; make the path always exist.
    && mkdir -p sentiment/node_modules

FROM node:${NODE_VERSION}-alpine AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    # `natural` calls dotenv on import; silence its banner in the logs.
    DOTENV_CONFIG_QUIET=true
WORKDIR /app
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/sentiment/node_modules ./sentiment/node_modules
COPY --from=build --chown=node:node /app/sentiment/dist ./sentiment/dist
COPY --chown=node:node sentiment/package.json ./sentiment/
WORKDIR /app/sentiment
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/server.js"]
