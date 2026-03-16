.ONESHELL:
SHELL := /bin/bash
all: help

############################################################################
# PROJECT CONFIG
PROJECT_NAME := tcg-lightning-xmage-bridge

############################################################################
# APP
run-user1: tspc ## run user1 (creates table, waits for user2)
	bun run dist/scripts/user1.js

run-user2: tspc ## run user2 (finds and joins first available table)
	bun run dist/scripts/user2.js

tspc: ## compile typescript with typia transforms
	bunx tspc

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
# XMAGE SERVER
XMAGE_REF := ref/mage
XMAGE_SERVER_ZIP := $(XMAGE_REF)/Mage.Server/target/mage-server.zip
XMAGE_SERVER_DIR := xmage-server

JVM_ADD_OPENS := --add-opens java.base/java.lang=ALL-UNNAMED \
	--add-opens java.base/java.io=ALL-UNNAMED \
	--add-opens java.base/java.util=ALL-UNNAMED \
	--add-opens java.base/java.lang.reflect=ALL-UNNAMED \
	--add-opens java.base/java.net=ALL-UNNAMED

xmage-run: ## run the xmage server (must be packaged first)
	cd $(XMAGE_SERVER_DIR) && java -Xmx1024m $(JVM_ADD_OPENS) -jar lib/mage-server-*.jar

xmage-build: ## build xmage server from ref/mage
	cd $(XMAGE_REF) && mvn install package -DskipTests

xmage-package: xmage-build ## build and package xmage server zip
	cd $(XMAGE_REF)/Mage.Server && mvn package assembly:single
	rm -rf $(XMAGE_SERVER_DIR)
	mkdir -p $(XMAGE_SERVER_DIR)
	unzip -o $(XMAGE_SERVER_ZIP) -d $(XMAGE_SERVER_DIR)

xmage-clean: ## clean xmage build artifacts
	cd $(XMAGE_REF) && mvn clean
	rm -rf $(XMAGE_SERVER_DIR)

xmage-init: ## install java, maven and protobuf via brew
	brew install openjdk maven protobuf

############################################################################
# WEBSOCKET PROXY
XMAGE_PROXY_DIR := $(XMAGE_REF)/Mage.WebsocketProxy

proxy-build: ## build the websocket proxy
	cd $(XMAGE_PROXY_DIR) && mvn compile

proxy-run: ## run the websocket proxy (xmage server must be running)
	cd $(XMAGE_PROXY_DIR) && MAVEN_OPTS="$(JVM_ADD_OPENS)" mvn exec:java

############################################################################
# PROTOBUF
PROTO_DIR := proto
PROTO_TS_OUT := src/generated
PROTO_JAVA_OUT := $(XMAGE_PROXY_DIR)/src/main/java

protogen: protogen-ts protogen-java ## generate all protobuf types

protogen-ts: ## generate typescript types from proto files
	rm -rf $(PROTO_TS_OUT)
	mkdir -p $(PROTO_TS_OUT)
	protoc \
		--plugin=./node_modules/.bin/protoc-gen-ts_proto \
		--ts_proto_out=$(PROTO_TS_OUT) \
		--ts_proto_opt=esModuleInterop=true \
		--ts_proto_opt=outputServices=false \
		--ts_proto_opt=useEnumNames=true \
		--ts_proto_opt=stringEnums=true \
		--ts_proto_opt=removeEnumPrefix=true \
		--proto_path=$(PROTO_DIR) \
		$(PROTO_DIR)/**/*.proto $(PROTO_DIR)/*.proto

protogen-java: ## generate java types from proto files
	protoc \
		--java_out=$(PROTO_JAVA_OUT) \
		--proto_path=$(PROTO_DIR) \
		$(PROTO_DIR)/**/*.proto $(PROTO_DIR)/*.proto

############################################################################
# HELP
help: ## print this help
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "\033[32m%-30s\033[0m %s\n", $$1, $$2}'
