# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY services/api-gateway/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install
COPY tsconfig.base.json /tsconfig.base.json
COPY libs/shared /libs/shared
COPY services/api-gateway/ .
# ensure module resolution from /libs/shared can find /app/node_modules
RUN ln -sf /app/node_modules /node_modules
RUN npm run build

ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production
COPY services/api-gateway/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install --omit=dev
# runtime needs shared models for relative imports and module resolution
COPY libs/shared /libs/shared
RUN ln -sf /app/node_modules /node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
