# syntax=docker/dockerfile:1.7
# GiftLink web client: Vite build served by unprivileged nginx. Build context: repo root.
#   docker build -f giftlink-frontend/Dockerfile -t giftlink-frontend .

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
    npm ci --workspace giftlink-frontend --ignore-scripts

# ---- dev: Vite dev server with HMR (sources bind-mounted) ------------------------------
FROM deps AS dev
COPY tsconfig.base.json ./
COPY giftlink-frontend giftlink-frontend
WORKDIR /app/giftlink-frontend
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0"]

# ---- build: type-check + bundle -------------------------------------------------------
FROM deps AS build
# Optional absolute API origin; empty means same-origin /api through nginx.
ARG VITE_BACKEND_URL=""
ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
COPY tsconfig.base.json ./
COPY giftlink-frontend giftlink-frontend
RUN npm run build --workspace giftlink-frontend

# ---- runtime: static files + /api reverse proxy ---------------------------------------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
# nginx renders /etc/nginx/templates/*.template with envsubst at startup.
ENV API_UPSTREAM=http://backend:3060
COPY giftlink-frontend/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY giftlink-frontend/nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/giftlink-frontend/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1:8080/healthz >/dev/null || exit 1
