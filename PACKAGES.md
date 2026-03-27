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

- `npx soleil-engine-cli --help` → **WORKS** (package name matches registry entry)
- `npx soleil-ai-review-engine --help` → **DOES NOT WORK** (see MIGRATION.md)
- Reason: `npx <name>` resolves against the npm registry by package name. `soleil-ai-review-engine` is a bin alias declared inside `soleil-engine-cli`'s `package.json`. Bin aliases are only registered to PATH after a package is installed — they are invisible to `npx` remote resolution, which only looks up the package name `soleil-ai-review-engine` and finds nothing in the registry.
