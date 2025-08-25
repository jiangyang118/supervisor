# syntax=docker/dockerfile:1
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml nx.json tsconfig.base.json ./
COPY services/user-service/package.json services/user-service/
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm -v || true

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate || true \
 && pnpm install --filter @foodsafe/user-service... --frozen-lockfile=false || true \
 && pnpm --filter @foodsafe/user-service build || true

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/services/user-service/dist ./dist
COPY services/user-service/package.json ./package.json
CMD ["node", "dist/main.js"]

