# syntax=docker/dockerfile:1
ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY services/user-service/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install
# tsconfig extends repo root; provide it at expected absolute path
COPY tsconfig.base.json /tsconfig.base.json
COPY libs/shared /libs/shared
COPY services/user-service/ .
# link /node_modules for shared module resolution
RUN ln -sf /app/node_modules /node_modules
RUN npm run build

ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production
COPY services/user-service/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install --omit=dev
COPY libs/shared /libs/shared
RUN ln -sf /app/node_modules /node_modules
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
