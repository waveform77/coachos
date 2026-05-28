.PHONY: dev up down build test migrate-up migrate-down seed lint help

# Colors
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RESET  := \033[0m

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(GREEN)%-20s$(RESET) %s\n", $$1, $$2}'

# ── Development ───────────────────────────────────────────────────────────────

dev: ## Start development environment (DB + hot-reload backend + Vite frontend)
	@echo "$(GREEN)Starting CoachOS development environment...$(RESET)"
	docker compose up postgres -d
	@echo "$(YELLOW)Waiting for PostgreSQL...$(RESET)"
	@sleep 3
	$(MAKE) -C backend run &
	$(MAKE) -C frontend dev

dev-backend: ## Start only backend in dev mode
	$(MAKE) -C backend run

dev-frontend: ## Start only frontend in dev mode
	$(MAKE) -C frontend dev

# ── Docker ────────────────────────────────────────────────────────────────────

up: ## Start full stack with Docker Compose
	docker compose up -d
	@echo "$(GREEN)CoachOS is running!$(RESET)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8080"
	@echo "  API Docs: http://localhost:8080/health"

down: ## Stop all Docker containers
	docker compose down

down-v: ## Stop all Docker containers and remove volumes
	docker compose down -v

build: ## Build all Docker images
	docker compose build

logs: ## Follow logs
	docker compose logs -f

logs-backend: ## Follow backend logs
	docker compose logs -f backend

restart-backend: ## Restart only backend container
	docker compose restart backend

# ── Database ──────────────────────────────────────────────────────────────────

migrate-up: ## Apply all pending migrations
	$(MAKE) -C backend migrate-up

migrate-down: ## Rollback last migration
	$(MAKE) -C backend migrate-down

migrate-create: ## Create new migration (usage: make migrate-create name=add_feature)
	$(MAKE) -C backend migrate-create name=$(name)

seed: ## Seed database with demo data
	$(MAKE) -C backend seed

db-reset: ## Reset database (migrate-down, migrate-up, seed)
	$(MAKE) migrate-down
	$(MAKE) migrate-up
	$(MAKE) seed

# ── Testing ───────────────────────────────────────────────────────────────────

test: ## Run all tests
	$(MAKE) -C backend test
	$(MAKE) -C frontend test

test-backend: ## Run backend tests
	$(MAKE) -C backend test

test-frontend: ## Run frontend tests
	$(MAKE) -C frontend test

test-e2e: ## Run E2E tests (requires running app)
	$(MAKE) -C frontend test-e2e

# ── Code Quality ──────────────────────────────────────────────────────────────

lint: ## Run all linters
	$(MAKE) -C backend lint
	$(MAKE) -C frontend lint

# ── Setup ─────────────────────────────────────────────────────────────────────

setup: ## Initial project setup (copy .env files, install deps)
	@echo "$(GREEN)Setting up CoachOS...$(RESET)"
	cp -n backend/.env.example backend/.env || true
	cp -n frontend/.env.example frontend/.env || true
	$(MAKE) -C frontend install
	@echo "$(GREEN)Setup complete! Edit backend/.env and run 'make dev'$(RESET)"

# ── Cleanup ───────────────────────────────────────────────────────────────────

clean: ## Remove build artifacts
	$(MAKE) -C backend clean
	$(MAKE) -C frontend clean

clean-all: clean down-v ## Remove everything including volumes
