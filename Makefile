dev:
	@echo "Starting dev (multi-repo scripts)"
	@pnpm dev

dev-all:
	@echo "Starting all (web + services) with HMR"
	@( $(MAKE) -s dev-web & $(MAKE) -s dev-services & wait )

dev-services:
    @echo "Starting services (hot reload)"
    @(npm --prefix services/gateway-service run dev & wait)

dev-web:
	@echo "Starting web apps (HMR)"
	@(npm --prefix apps/web-school run dev & npm --prefix apps/web-regulator run dev & wait)

start-services:
    @echo "Build and start services (no HMR)"
    @npm --prefix services/gateway-service run build
    @(node services/gateway-service/dist/main.js > /tmp/gateway-service.out 2>&1 & echo $$! > /tmp/gateway-service.pid)
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
	@echo "Running DB migrations (default: mysql://foodsafe:secret@127.0.0.1:3306/foodsafe_dev)"
	@DATABASE_URL="$${DATABASE_URL:-mysql://foodsafe:secret@127.0.0.1:3306/foodsafe_dev}" pnpm -C services/gateway-service db:migrate
