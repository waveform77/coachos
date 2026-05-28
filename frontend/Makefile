.PHONY: dev build test test-e2e lint install clean

dev: ## Start Vite dev server
	npm run dev

build: ## Build for production
	npm run build

preview: ## Preview production build
	npm run preview

install: ## Install dependencies
	npm install

test: ## Run Vitest unit tests
	npm run test -- --run

test-watch: ## Run tests in watch mode
	npm run test

test-coverage: ## Run tests with coverage
	npm run test -- --run --coverage

test-e2e: ## Run Playwright E2E tests (starts dev server unless PLAYWRIGHT_SKIP_WEBSERVER=1)
	npm run test:e2e

lint: ## Run ESLint
	npm run lint

lint-fix: ## Run ESLint with auto-fix
	npm run lint -- --fix

clean: ## Remove build artifacts
	rm -rf dist node_modules/.vite
