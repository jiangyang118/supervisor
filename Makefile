dev:
	@echo "Starting dev (multi-repo scripts)"
	@pnpm dev

dev-services:
	@echo "Starting services (hot reload)"
	@(npm --prefix services/api-gateway run dev & npm --prefix services/user-service run dev & wait)

build:
	@pnpm build

demo:
	bash scripts/demo.sh
