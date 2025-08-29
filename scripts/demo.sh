#!/usr/bin/env bash
set -Eeuo pipefail

# Demo launcher with beginner-friendly checks and logs

SERVICES=(postgres redis minio zookeeper kafka kafka-ui api-gateway user-service nginx)
COMPOSE_FILE="infra/docker-compose.yml"
COMPOSE_CN_FILE="infra/docker-compose.cn.yml"
USE_CN=0
FOREGROUND=0

log() { echo "[demo] $*"; }
warn() { echo "[demo][WARN] $*"; }
err() { echo "[demo][ERROR] $*"; }
die() { err "$*"; exit 1; }

on_exit() {
  local code=$?
  if [[ $code -ne 0 ]]; then
    err "Script exited with code $code. See logs above."
  fi
}
trap on_exit EXIT

usage() {
  cat <<USAGE
Usage: bash scripts/demo.sh [--foreground] [--cn]

Options:
  --foreground   Run docker compose in foreground (no -d) to see live output
  --cn           Use domestic mirrors (compose override) for faster image pulls

This script starts required infra via docker compose and performs health checks
with detailed hints when something goes wrong.
USAGE
}

for arg in "$@"; do
  case "$arg" in
    --foreground) FOREGROUND=1 ;;
    --cn) USE_CN=1 ;;
    -h|--help) usage; exit 0 ;;
    *) warn "Unknown arg: $arg" ;;
  esac
done

log "Loading .env (if exists)"
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env || true
  set +a
fi

# Prechecks
command -v docker >/dev/null 2>&1 || die "Docker not installed. Please install Docker Desktop or Engine and retry."

if ! docker info >/dev/null 2>&1; then
  die "Docker daemon is not running or permission denied. Start Docker and ensure your user can run 'docker' without sudo."
fi

DC=""
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  die "docker compose not found. Install Compose v2 (preferred) or docker-compose."
fi

[[ -f "$COMPOSE_FILE" ]] || die "Compose file not found: $COMPOSE_FILE"

log "Using compose command: $DC"
log "Compose file: $COMPOSE_FILE"
if [[ $USE_CN -eq 1 ]]; then
  if [[ -f "$COMPOSE_CN_FILE" ]]; then
    log "CN override: $COMPOSE_CN_FILE (domestic mirrors enabled)"
  else
    warn "CN override file not found: $COMPOSE_CN_FILE"
    USE_CN=0
  fi
fi
log "Services: ${SERVICES[*]}"

# Start services
if [[ $FOREGROUND -eq 1 ]]; then
  log "Starting services in foreground (Ctrl+C to stop)"
  if [[ $USE_CN -eq 1 ]]; then
    exec $DC -f "$COMPOSE_FILE" -f "$COMPOSE_CN_FILE" up "${SERVICES[@]}"
  else
    exec $DC -f "$COMPOSE_FILE" up "${SERVICES[@]}"
  fi
else
  log "Starting services in background (detached)"
  if [[ $USE_CN -eq 1 ]]; then
    $DC -f "$COMPOSE_FILE" -f "$COMPOSE_CN_FILE" up -d "${SERVICES[@]}"
  else
    $DC -f "$COMPOSE_FILE" up -d "${SERVICES[@]}"
  fi
fi

log "Listing service status"
$DC -f "$COMPOSE_FILE" ps || true

wait_http() {
  local url=$1
  local timeout=${2:-60}
  local start=$(date +%s)
  while true; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    local now=$(date +%s)
    if (( now - start >= timeout )); then
      return 1
    fi
    sleep 2
  done
}

log "Waiting for API Gateway health (http://localhost:3300/health)"
if wait_http "http://localhost:3300/health" 90; then
  log "API Gateway is healthy."
else
  err "API Gateway health check failed within timeout. Printing recent logs:"
  $DC -f "$COMPOSE_FILE" logs --tail=200 api-gateway || true
  warn "Common causes: network/proxy issues during npm install, slow first-time image pull, build errors."
  warn "Tip: run in foreground to see build logs: bash scripts/demo.sh --foreground"
  exit 1
fi

log "Basic seeds (placeholder)"
# TODO: add real seed scripts

log "Demo ready. Open API docs: http://localhost/api/docs"
