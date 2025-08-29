# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY services/school-integration-service/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install
COPY tsconfig.base.json /tsconfig.base.json
COPY services/school-integration-service/ .
RUN npm run build

ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production
COPY services/school-integration-service/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/src/server.js"]

