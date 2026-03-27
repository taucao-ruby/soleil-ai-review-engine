# Migration guide

## Canonical executable

```
soleil
```

## Canonical package

```
soleil-engine-cli — version 1.4.0
```

## Command status

| Command                             | Status                          | Until  |
|-------------------------------------|---------------------------------|--------|
| `soleil analyze --skills`           | CANONICAL                       | —      |
| `soleil query / context / impact`   | CANONICAL                       | —      |
| `gitnexus analyze --skills`         | DEPRECATED alias                | v2.0   |
| `gitnexus query / context / impact` | DEPRECATED alias                | v2.0   |
| `soleil-ai-review-engine <cmd>`     | DEPRECATED alias (post-install) | v2.0   |
| `npx soleil-ai-review-engine`       | NOT SUPPORTED (see below)       | —      |

## Why `npx soleil-ai-review-engine` does not work

**Exact error from a clean environment (no local install):**
```
npm error code E404
npm error 404 Not Found - GET https://registry.npmjs.org/soleil-ai-review-engine - Not found
npm error 404
npm error 404  'soleil-ai-review-engine@*' is not in this registry.
```

`npx <name>` works in two modes: (1) if a binary named `<name>` exists in `node_modules/.bin/` of the current project, it runs that; (2) otherwise it downloads the npm package named `<name>` from the registry. The bin alias `soleil-ai-review-engine` is declared in the `bin` field of `soleil-engine-cli`'s `package.json`. That alias is only wired into `node_modules/.bin/` **after** `soleil-engine-cli` is installed. It is not a separately published package, so `npx soleil-ai-review-engine` in a clean environment always fails with 404. To make `npx soleil-ai-review-engine` work globally, a separate package named `soleil-ai-review-engine` would need to be published to the npm registry — either containing the full CLI or acting as a thin re-export of `soleil-engine-cli`.

## Migration path for existing gitnexus users

1. Uninstall the old package: `npm uninstall -g gitnexus` (if previously installed globally)
2. Install the current package: `npm install -g soleil-engine-cli`
3. Replace all invocations of `gitnexus` with `soleil` in scripts, CI configs, and MCP configs
4. Re-run `soleil setup` to update MCP server paths in Cursor/Claude Code configs

## What is not decided yet

- **npm publish timeline** — `soleil-engine-cli` is not currently published to the public npm registry; installation is from local tarball or direct git reference
- **alias package strategy** — whether to publish a thin `soleil-ai-review-engine` shim package on npm to support `npx soleil-ai-review-engine` has not been decided
- **v2.0 deprecation enforcement** — the target version for removing `gitnexus` and `soleil-ai-review-engine` bin aliases is v2.0; no release date is set
