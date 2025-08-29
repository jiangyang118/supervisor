# syntax=docker/dockerfile:1
# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY services/api-gateway/package.json ./package.json
RUN npm install
COPY services/api-gateway/ .
RUN npm run build

ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production
COPY services/api-gateway/package.json ./package.json
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
