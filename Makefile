.ONESHELL:
SHELL := /bin/bash
all: help

############################################################################
# PROJECT CONFIG
PROJECT_NAME := tcg-lightning-xmage-bridge

############################################################################
# APP
build: ## build the library
	bun run build

clean: ## clean build artifacts
	rm -rf dist

typecheck: ## run typescript type checking
	bun run typecheck

############################################################################
# TEST
test: ## run tests
	bun test

test-watch: ## run tests in watch mode
	bun test --watch

############################################################################
# LINT / FORMAT
lint: ## run biome linter
	npx biome check src/ tests/

lint-fix: ## run biome linter and fix issues
	npx biome check --write src/ tests/

format: ## format code with biome
	npx biome format --write src/ tests/

############################################################################
# DEV
check: typecheck lint test ## run all checks (typecheck, lint, test)

############################################################################
# HELP
help: ## print this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}'
