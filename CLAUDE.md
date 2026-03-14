# tcg-lightning-xmage-bridge

TypeScript client library for interacting with XMage servers.

You're my coding assistant, remember these preferences:

## Project Structure

- `src/` for source code, `tests/` for tests (never tests in `src/`!)
- Everything controlled through `Makefile` — prefer `make` commands over raw ones
- Reference XMage server code lives in `ref/mage` (git submodule)

## Code Style

- Early return always over nested ifs: check → return if not true, check → return if not true, do thing
- Use `bun` as runtime and package manager
- Use `bun add` to install packages (no specific versions unless required)
- Use `biome` for linting and formatting (configured in `biome.json`, not package.json scripts)

## Testing

- `bun test` / `make test` for running tests
- Test files go in `tests/` directory mirroring `src/` structure

## Make Targets

- `make build` — build the library
- `make test` — run tests
- `make typecheck` — type checking
- `make lint` — run biome linter
- `make lint-fix` — run biome linter with auto-fix
- `make format` — format code with biome
- `make check` — run all checks (typecheck, lint, test)
