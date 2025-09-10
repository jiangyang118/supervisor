ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE} AS builder
WORKDIR /app
COPY services/gateway-service/package.json ./package.json
RUN npm config set registry https://registry.npmmirror.com \
 && npm install
COPY tsconfig.base.json /tsconfig.base.json
COPY libs/shared /libs/shared
COPY services/gateway-service/ .
# ensure module resolution from /libs/shared can find /app/node_modules
RUN ln -sf /app/node_modules /node_modules
RUN npm run build
RUN npm prune --omit=dev

ARG NODE_IMAGE=node:20-alpine
FROM ${NODE_IMAGE}
WORKDIR /app
ENV NODE_ENV=production
COPY services/gateway-service/package.json ./package.json
# reuse pruned node_modules from builder to avoid re-installing in runtime image
COPY --from=builder /app/node_modules ./node_modules
# runtime needs shared models for relative imports and module resolution
COPY libs/shared /libs/shared
RUN ln -sf /app/node_modules /node_modules
COPY --from=builder /app/dist ./dist
# copy migration scripts and sql
COPY services/gateway-service/scripts ./scripts
COPY services/gateway-service/migrations ./migrations

# run migrations before starting the app
CMD ["sh", "-c", "node scripts/run-migrations.js && node dist/services/gateway-service/src/main.js"]
