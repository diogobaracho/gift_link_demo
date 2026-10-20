# GiftLink developer commands. Run `make` or `make help` to list them.
SHELL := /bin/bash
.DEFAULT_GOAL := help

COMPOSE     := docker compose
COMPOSE_DEV := docker compose -f docker-compose.yml -f docker-compose.dev.yml
# Host ports (override when busy, e.g. `make up FRONTEND_PORT=8088`); exported to compose.
export FRONTEND_PORT  ?= 9000
export BACKEND_PORT   ?= 3060
export SENTIMENT_PORT ?= 3000
FRONTEND_URL  := http://localhost:$(FRONTEND_PORT)
BACKEND_URL   := http://localhost:$(BACKEND_PORT)
SENTIMENT_URL := http://localhost:$(SENTIMENT_PORT)

##@ Help
.PHONY: help
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} \
	  /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2 } \
	  /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Setup
.PHONY: install env
install: ## Install all workspace dependencies (npm ci) and git hooks
	npm ci

env: ## Create local .env files from the examples (never overwrites)
	@for f in .env giftlink-backend/.env giftlink-frontend/.env sentiment/.env; do \
	  dir=$$(dirname $$f); [ -f $$f ] || { cp $$dir/.env.example $$f && echo "created $$f"; }; \
	done

##@ Run with Docker
.PHONY: up down restart build logs ps dev smoke
up: ## Build and start the full stack in the background ($(FRONTEND_URL))
	$(COMPOSE) up --build --detach --wait

down: ## Stop the stack (MongoDB data is kept)
	$(COMPOSE) --profile tools down

restart: down up ## Restart the stack

build: ## Build all Docker images
	$(COMPOSE) --profile tools build

logs: ## Follow logs of all services (s=<service> for one)
	$(COMPOSE) logs --follow --tail=100 $(s)

ps: ## Show service status and health
	$(COMPOSE) ps

dev: ## Start the stack with hot reload (Vite on http://localhost:5173)
	$(COMPOSE_DEV) up --build

smoke: ## Check that every service answers its health endpoint
	@curl -fsS $(BACKEND_URL)/health   && echo "  backend   OK"
	@curl -fsS $(BACKEND_URL)/ready    && echo "  mongo     OK"
	@curl -fsS $(SENTIMENT_URL)/health && echo "  sentiment OK"
	@curl -fsS $(FRONTEND_URL)/healthz && echo "  frontend  OK"
	@curl -fsS $(FRONTEND_URL)/api/gifts?limit=1 > /dev/null && echo "  proxy     OK"

##@ Data
.PHONY: seed seed-reset seed-local db-shell
seed: ## Load demo gifts, users and comments (idempotent)
	$(COMPOSE) run --rm seed

seed-reset: ## Wipe gifts/users/comments and reload the demo data
	$(COMPOSE) run --rm seed node dist/scripts/seed.js --reset

seed-local: ## Seed using local Node against MONGO_URL from giftlink-backend/.env
	npm run seed --workspace giftlink-backend

db-shell: ## Open mongosh on the giftdb database
	$(COMPOSE) exec mongo sh -c 'mongosh -u "$$MONGO_INITDB_ROOT_USERNAME" -p "$$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin $${MONGO_DB_NAME:-giftdb}'

##@ Quality
.PHONY: lint lint-fix format format-check typecheck check
lint: ## Lint every workspace (ESLint, zero warnings)
	npm run lint

lint-fix: ## Lint and auto-fix
	npm run lint:fix

format: ## Format all files with Prettier
	npm run format

format-check: ## Verify formatting without writing
	npm run format:check

typecheck: ## Type-check every workspace
	npm run typecheck

check: ## The CI quality gate: lint + format-check + typecheck + tests with coverage
	npm run check

##@ Tests
.PHONY: test test-backend test-sentiment test-frontend coverage
test: ## Run all unit and integration tests
	npm test

test-backend: ## Backend tests (Vitest + supertest + in-memory MongoDB)
	npm test --workspace giftlink-backend

test-sentiment: ## Sentiment service tests
	npm test --workspace sentiment

test-frontend: ## Frontend component tests (Vitest + Testing Library + MSW)
	npm test --workspace giftlink-frontend

coverage: ## All tests with coverage reports (see */coverage/index.html)
	npm run test:coverage

##@ Cleanup
.PHONY: clean
clean: ## Stop the stack, delete volumes, build output and coverage
	$(COMPOSE) --profile tools down --volumes --remove-orphans
	rm -rf */dist */coverage e2e/playwright-report e2e/test-results
