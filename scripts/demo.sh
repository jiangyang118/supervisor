#!/usr/bin/env bash
set -euo pipefail

echo "[demo] Loading .env (if exists)"
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs) || true
fi

echo "[demo] Starting infra and core services via docker-compose"
docker compose -f infra/docker-compose.yml up -d postgres redis minio zookeeper kafka kafka-ui api-gateway user-service nginx

echo "[demo] Waiting for services to be ready..."
sleep 8

echo "[demo] Health checks"
curl -fsS http://localhost:3000/health || true

echo "[demo] Seed data (placeholder)"
# TODO: run seed scripts against services

echo "[demo] Trigger mock AI events (placeholder)"
# TODO: call ai-vision-service when available

echo "[demo] Generate daily PDF reports (placeholder)"
# TODO: call export endpoints

echo "[demo] Done. Open API docs: http://localhost/api/docs"

