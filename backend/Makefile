.PHONY: run build test migrate-up migrate-down seed lint docker-build

# Load .env if it exists
ifneq (,$(wildcard ./.env))
  include .env
  export
endif

APP_NAME  := api
BUILD_DIR := ./bin
CMD_DIR   := ./cmd/api

# CLI golang-migrate без brew: использует toolchain Go (тег postgres — драйвер БД)
MIGRATE := go run -tags postgres github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.2

# Fallback без Go: образ migrate/migrate (см. migrate-up)
MIGRATE_IMAGE := migrate/migrate:v4.18.2

# С контейнера migrate до Postgres на машине: localhost в .env → host.docker.internal (Mac/Win; Linux — add-host ниже)
ifeq ($(DB_HOST),localhost)
  MIGRATE_DOCKER_HOST := host.docker.internal
else ifeq ($(DB_HOST),127.0.0.1)
  MIGRATE_DOCKER_HOST := host.docker.internal
else
  MIGRATE_DOCKER_HOST := $(DB_HOST)
endif

MIGRATE_DATABASE_URL := postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)
MIGRATE_DATABASE_URL_DOCKER := postgres://$(DB_USER):$(DB_PASSWORD)@$(MIGRATE_DOCKER_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSL_MODE)

## run: Start the API server
run:
	go run $(CMD_DIR)/main.go

## build: Compile the binary
build:
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 go build -ldflags="-w -s" -o $(BUILD_DIR)/$(APP_NAME) $(CMD_DIR)
	@echo "Binary built: $(BUILD_DIR)/$(APP_NAME)"

## test: Run all tests
test:
	go test ./... -v -race -count=1

## migrate-up: Apply all pending migrations (Go в PATH или Docker)
migrate-up:
	@if command -v go >/dev/null 2>&1; then \
		$(MIGRATE) -path ./migrations \
		  -database "$(MIGRATE_DATABASE_URL)" \
		  up; \
	elif command -v docker >/dev/null 2>&1; then \
		docker run --rm \
		  --add-host=host.docker.internal:host-gateway \
		  -v "$$(pwd)/migrations:/migrations" \
		  $(MIGRATE_IMAGE) \
		  -path=/migrations \
		  -database "$(MIGRATE_DATABASE_URL_DOCKER)" \
		  up; \
	else \
		echo "Не найден ни go, ни docker. Установите Go (https://go.dev/dl/) и добавьте его в PATH, либо установите Docker Desktop." >&2; \
		exit 1; \
	fi

## migrate-down: Roll back last migration (Go в PATH или Docker)
migrate-down:
	@if command -v go >/dev/null 2>&1; then \
		$(MIGRATE) -path ./migrations \
		  -database "$(MIGRATE_DATABASE_URL)" \
		  down 1; \
	elif command -v docker >/dev/null 2>&1; then \
		docker run --rm \
		  --add-host=host.docker.internal:host-gateway \
		  -v "$$(pwd)/migrations:/migrations" \
		  $(MIGRATE_IMAGE) \
		  -path=/migrations \
		  -database "$(MIGRATE_DATABASE_URL_DOCKER)" \
		  down 1; \
	else \
		echo "Не найден ни \`go\`, ни \`docker\`. Установите Go или Docker." >&2; \
		exit 1; \
	fi

## seed: Run the database seeder
seed:
	go run ./seeds/cmd/main.go

## lint: Run golangci-lint
lint:
	golangci-lint run ./...

## docker-build: Build the Docker image
docker-build:
	docker build -t coachos-api:latest .

## tidy: Tidy go modules
tidy:
	go mod tidy

