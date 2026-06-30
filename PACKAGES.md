# Packages

## Canonical CLI package

```
name:    soleil-engine-cli
version: 1.4.0
executable: soleil
install: npm install -g soleil-engine-cli
```

## All packages

| Package | Role | User-facing? | Depends on |
|---------|------|-------------|------------|
| `soleil-engine-cli` | CLI + MCP server + analysis engine | Yes | (external npm only) |
| `soleil-ai-review-engine-web` | Web UI shell | Yes | `soleil-engine-cli` at runtime (HTTP) |
| `soleil-ai-review-engine-claude-plugin` | Claude Code hook | Yes | `soleil-engine-cli` (reads index) |
| `soleil-ai-review-engine-cursor-integration` | Cursor IDE integration | Yes | `soleil-engine-cli` (reads index) |
| `soleil-ai-review-engine-test-setup` | Test fixtures | No (dev only) | — |

## What npx can and cannot do today

- `npx soleil-engine-cli --help` → **WORKS, but only if the package is already installed** (locally as a project dependency, or globally via `npm install -g soleil-engine-cli`). It does **not** work because the name "matches a registry entry" — `soleil-engine-cli` is **not published to the public npm registry** (see MIGRATION.md). It works because npm's bin resolution (`libnpmexec/lib/get-bin-from-manifest.js`) collapses multiple `bin` aliases into one when they all point to the same file — `soleil`, `gitnexus`, and `soleil-ai-review-engine` all resolve to `dist/cli/index.js`, so npx picks the first-declared key (`soleil`) instead of erroring. On a machine with **no prior install**, `npx soleil-engine-cli` fails exactly like any other unpublished package (404), not via a bin-resolution error.
- `npx soleil-ai-review-engine --help` → **DOES NOT WORK** as a registry fetch (see MIGRATION.md) — `soleil-ai-review-engine` is not a published package name at all, so this 404s even where `soleil-engine-cli` is installed under a different name, unless that exact alias is already shimmed into a local/global `node_modules/.bin/`.
- **Recommended invocation** (works regardless of the alias-collapse behavior above, and stays correct even if a future release ever differentiates the deprecated `gitnexus`/`soleil-ai-review-engine` bin targets from `soleil`): `npx -p soleil-engine-cli soleil <cmd>` — explicitly resolves the real package name, then runs the canonical `soleil` bin from it.
