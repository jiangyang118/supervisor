ENV ?= local

# Helper: source root .env and .env.$(ENV) if present
define LOAD_ENV
set -a; \
  [ -f .env ] && . ./.env; \
  [ -f .env.$(ENV) ] && . ./.env.$(ENV); \
set +a; \
true
endef

dev:
	@echo "Starting dev (multi-repo scripts)"
	@pnpm dev

dev-all:
	@echo "Starting all (web + services) with HMR [ENV=$(ENV)]"
	@( $(MAKE) -s dev-web & $(MAKE) -s ENV=$(ENV) dev-services & wait )

dev-services:
	@echo "Starting services (hot reload) [ENV=$(ENV)]"
	@( $(LOAD_ENV); npm --prefix services/gateway-service run dev & wait )

dev-web:
	@echo "Starting web apps (HMR)"
	@(npm --prefix apps/web-school run dev & npm --prefix apps/web-regulator run dev & wait)

start-services:
	@echo "Build and start services (no HMR) [ENV=$(ENV)]"
	@npm --prefix services/gateway-service run build
	@( $(LOAD_ENV); node services/gateway-service/dist/main.js > /tmp/gateway-service.out 2>&1 & echo $$! > /tmp/gateway-service.pid)
	@echo "Gateway PID: $$(cat /tmp/gateway-service.pid)"

stop-services:
	@echo "Stopping services"
	-@[ -f /tmp/gateway-service.pid ] && kill $$(cat /tmp/gateway-service.pid) 2>/dev/null || true
	@rm -f /tmp/gateway-service.pid

build:
	@pnpm build

demo:
	bash scripts/demo.sh

migrate:
	@echo "Running DB migrations [ENV=$(ENV)]"
		@( $(LOAD_ENV); DATABASE_URL="$${DATABASE_URL:-mysql://root:ygyg1344@127.0.0.1:3307/foodsafe}" pnpm -C services/gateway-service db:migrate )

# Convenience targets
dev-local:
	@$(MAKE) -s ENV=local dev-all

dev-test:
	@$(MAKE) -s ENV=test dev-all

dev-prod:
	@$(MAKE) -s ENV=prod dev-all

start-local:
	@$(MAKE) -s ENV=local start-services

start-test:
	@$(MAKE) -s ENV=test start-services

start-prod:
	@$(MAKE) -s ENV=prod start-services

# Docker compose helpers (host DB)
compose-up-host:
	@echo "Compose up services (host DB)"
	docker compose -f infra/docker-compose.yml up -d redis minio zookeeper kafka kafka-ui gateway-service nginx

compose-logs:
	@echo "Tailing gateway-service logs"
	docker compose -f infra/docker-compose.yml logs -f gateway-service

compose-down:
	@echo "Compose down"
	docker compose -f infra/docker-compose.yml down
