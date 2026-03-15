# tcg-lightning-xmage-bridge

TypeScript client library for interacting with XMage servers.

You're my coding assistant, remember these preferences:

## Project Structure

- `src/` for source code, `tests/` for tests (never tests in `src/`!)
- Everything controlled through `Makefile` — prefer `make` commands over raw ones
- Reference XMage server code lives in `ref/mage` (git submodule, fork at `Dimfred/mage` branch `feat/websocket-proxy`)
- `scripts/` for runnable scripts (e.g. `user1.ts`)

## Code Style

- Early return always over nested ifs: check → return if not true, check → return if not true, do thing
- Use `bun` as runtime and package manager
- Use `bun add` to install packages (no specific versions unless required)
- Use `biome` for linting and formatting (configured in `biome.json`, not package.json scripts)
- Use `typia` for runtime validation — requires `tspc` compile step before running
- Use `pino` for logging — `glogger` is the root logger, `createLogger('ClassName')` for derived loggers

## Testing

- `bun test` / `make test` for running tests
- Test files go in `tests/` directory mirroring `src/` structure

## Make Targets

- `make build` — build the library
- `make test` — run tests
- `make typecheck` — type checking
- `make tspc` — compile TypeScript with typia transforms
- `make run-user1` — compile and run user1 script
- `make lint` — run biome linter
- `make lint-fix` — run biome linter with auto-fix
- `make format` — format code with biome
- `make check` — run all checks (typecheck, lint, test)

## XMage Server & WebSocket Proxy

- XMage is built with Java 8 (`java.version=1.8`) — the proxy MUST target Java 8 too to avoid module access issues with JBoss Remoting
- Proxy lives in `ref/mage/Mage.WebsocketProxy` — a Maven module in the XMage fork
- Uses Jetty 9 (last Java 8 compatible version) for WebSocket server
- `make xmage-run` — run the XMage server
- `make xmage-build` — build XMage from ref/mage
- `make xmage-package` — build and package server zip
- `make proxy-build` — build the WebSocket proxy
- `make proxy-run` — run the proxy
