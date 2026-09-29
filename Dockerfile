# syntax = docker/dockerfile:1

# Node version pinned to match mise.toml. better-sqlite3 needs a native
# build; build-essential/python3 are the fallback for when no prebuilt
# binary matches this exact node/arch (prebuild-install tries that first).
FROM node:24.21.0-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
COPY README.md ./README.md

ENV HOST=0.0.0.0
ENV DB_PATH=/data/scroll.db
EXPOSE 8080
CMD ["node", "./dist/server/entry.mjs"]
