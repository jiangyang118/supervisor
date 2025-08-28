dev:
	@echo "Starting dev (multi-repo scripts)"
	@pnpm dev

dev-all:
	@echo "Starting all (web + services) with HMR"
	@( $(MAKE) -s dev-web & $(MAKE) -s dev-services & wait )

dev-services:
	@echo "Starting services (hot reload)"
	@(npm --prefix services/api-gateway run dev & npm --prefix services/user-service run dev & wait)

dev-web:
	@echo "Starting web apps (HMR)"
	@(npm --prefix apps/web-school run dev & npm --prefix apps/web-regulator run dev & wait)

start-services:
	@echo "Build and start services (no HMR)"
	@npm --prefix services/api-gateway run build
	@npm --prefix services/user-service run build
	@(node services/api-gateway/dist/main.js > /tmp/api-gateway.out 2>&1 & echo $$! > /tmp/api-gateway.pid)
	@(node services/user-service/dist/main.js > /tmp/user-service.out 2>&1 & echo $$! > /tmp/user-service.pid)
	@echo "API Gateway PID: $$(cat /tmp/api-gateway.pid), User Service PID: $$(cat /tmp/user-service.pid)"

stop-services:
	@echo "Stopping services"
	-@[ -f /tmp/api-gateway.pid ] && kill $$(cat /tmp/api-gateway.pid) 2>/dev/null || true
	-@[ -f /tmp/user-service.pid ] && kill $$(cat /tmp/user-service.pid) 2>/dev/null || true
	@rm -f /tmp/api-gateway.pid /tmp/user-service.pid

build:
	@pnpm build

demo:
	bash scripts/demo.sh
