# tcg-lightning-xmage-bridge

TypeScript client library for interacting with XMage servers via a WebSocket proxy.

## Install

```bash
git submodule update --init --recursive
make xmage-init
bun install
make xmage-package
make protogen
```

## Run

```bash
make help          # show all available targets
make xmage-run     # start the XMage server (terminal 1)
make proxy-run     # start the WebSocket proxy (terminal 2)
make run-try       # run the test script (terminal 3)
```
