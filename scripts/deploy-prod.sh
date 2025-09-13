#!/usr/bin/env bash
set -euo pipefail

# Production deploy script for gateway-service
# - Builds the NestJS gateway
# - Starts or reloads PM2 (cluster mode via ecosystem.config.js)
# - Performs health checks

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GATEWAY_DIR="$REPO_DIR/services/gateway-service"
PORT="${PORT:-3300}"
HEALTH_URL="http://127.0.0.1:${PORT}/health"

echo "[deploy] Repo dir: $REPO_DIR"

if ! command -v pm2 >/dev/null 2>&1; then
  echo "[deploy][error] pm2 not found. Install via: npm i -g pm2" >&2
  exit 1
fi

echo "[deploy] Building gateway-service..."
cd "$GATEWAY_DIR"
# Use npm ci to ensure clean, reproducible install (requires package-lock.json)
npm ci
npm run build

echo "[deploy] Starting or reloading PM2 app: gateway-service"
cd "$REPO_DIR"
if pm2 describe gateway-service >/dev/null 2>&1; then
  pm2 reload gateway-service --update-env
else
  pm2 start "$REPO_DIR/ecosystem.config.js" --only gateway-service
fi

echo "[deploy] Waiting for health check: ${HEALTH_URL}"
tries=60
while (( tries > 0 )); do
  if curl -sf "$HEALTH_URL" | grep -q '"ok":true'; then
    echo "[deploy] Health check OK"
    break
  fi
  tries=$((tries-1))
  sleep 1
done

if (( tries == 0 )); then
  echo "[deploy][error] Health check failed: ${HEALTH_URL}" >&2
  pm2 logs gateway-service --lines 200
  exit 2
fi

echo "[deploy] Deployment complete. To enable startup on boot:"
echo "        pm2 startup && pm2 save"

