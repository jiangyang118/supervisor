#!/usr/bin/env bash
set -Eeuo pipefail

# MEGO-only demo launcher with prechecks for beginners
# Starts gateway-service(3300) and device-mock(4003) outside Docker

HOST=${HOST:-localhost}
EQUIPMENT_CODE=${EQUIPMENT_CODE:-DEMO-EC-0001}
DO_EMIT=0
SKIP_REG=0

log(){ echo "[mego] $*"; }
warn(){ echo "[mego][WARN] $*"; }
err(){ echo "[mego][ERROR] $*"; }
die(){ err "$*"; exit 1; }

usage(){ cat <<USAGE
Usage: bash scripts/mego.sh [--host <ip|host>] [--emit] [--skip-reg]

Options:
  --host <h>   Set base host for services (default: localhost)
  --emit       After startup, auto-generate 10 morning-check records
  --skip-reg   Do not start regulator-api (4002). mego-emit will skip regulator

This script checks Node/npm/ports, then starts three dev servers via npm and prints
Web-School integration hints.
USAGE
}

for ((i=1; i <= $#; i++)); do
  case "${!i}" in
    --host)
      j=$((i+1)); HOST=${!j:-$HOST}; i=$j ;;
    --emit) DO_EMIT=1 ;;
    --skip-reg) SKIP_REG=1 ;;
    -h|--help) usage; exit 0 ;;
  esac
done

# Prechecks
command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 20+."
command -v npm >/dev/null 2>&1 || die "npm not found. Install npm."

# Node version >= 20
NV=$(node -v | sed 's/^v//')
MAJOR=${NV%%.*}
if [ "${MAJOR}" -lt 20 ]; then
  die "Node ${NV} detected. Please use Node 20+"
fi

check_port(){ local p=$1; if command -v lsof >/dev/null 2>&1; then lsof -i :$p -sTCP:LISTEN -Pn || true; elif command -v nc >/dev/null 2>&1; then nc -z localhost $p && echo "tcp LISTEN on :$p" || true; fi; }

log "Port check (may be empty if free):"
check_port 4001
check_port 4002
check_port 4003

log "Installing deps if needed..."
for d in services/gateway-service services/device-mock; do
  if [ -d "$d" ] && [ ! -d "$d/node_modules" ]; then (cd "$d" && npm i); fi
done

log "Starting services (Ctrl+C to stop):"
SCHOOL_API_BASE="http://$HOST:3300" REGULATOR_API_BASE="http://$HOST:3300" DEVICE_MOCK_BASE="http://$HOST:4003" EQUIPMENT_CODE="$EQUIPMENT_CODE" \
  node scripts/mego-demo.js &
PID=$!

sleep 6

log "Hints for Web-School integration:"
echo "  1) Edit apps/web-school/public/integration.config.json to point to:"
echo "     \"SCHOOL_INTEGRATION_BASE\": \"http://$HOST:3300\", \"MEGO_CANDIDATES\": \"http://$HOST:4003\""
echo "  2) Or in the Web UI banner, click ‘设置’填写上述地址"
echo "  3) Devices → 新增设备（米果晨检仪）→ equipmentCode=$EQUIPMENT_CODE → 自动搜索"

if [ $DO_EMIT -eq 1 ]; then
  log "Emitting 10 demo morning-checks..."
  HOST="$HOST" EQUIPMENT_CODE="$EQUIPMENT_CODE" npm run demo:mego:emit
fi

wait $PID
