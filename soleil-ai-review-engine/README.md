# soleil-ai-review-engine

**Graph-powered code intelligence for AI agents.** Index any codebase into a knowledge graph, then query it via MCP or CLI.

Works with **Cursor**, **Claude Code**, **Windsurf**, **Cline**, **OpenCode**, and any MCP-compatible tool.

[![npm version](https://img.shields.io/npm/v/soleil-ai-review-engine.svg)](https://www.npmjs.com/package/soleil-ai-review-engine)
[![License: PolyForm Noncommercial](https://img.shields.io/badge/License-PolyForm%20Noncommercial-blue.svg)](https://polyformproject.org/licenses/noncommercial/1.0.0/)

---

## Why?

AI coding tools don't understand your codebase structure. They edit a function without knowing 47 other functions depend on it. soleil-ai-review-engine fixes this by **precomputing every dependency, call chain, and relationship** into a queryable graph.

**Three commands to give your AI agent full codebase awareness.**

## Quick Start

```bash
# Index your repo (run from repo root)
npx soleil-ai-review-engine analyze
```

That's it. This indexes the codebase, installs agent skills, registers Claude Code hooks, and creates `AGENTS.md` / `CLAUDE.md` context files — all in one command.

To configure MCP for your editor, run `npx soleil-ai-review-engine setup` once — or set it up manually below.

`soleil-ai-review-engine setup` auto-detects your editors and writes the correct global MCP config. You only need to run it once.

### Editor Support

| Editor | MCP | Skills | Hooks (auto-augment) | Support |
|--------|-----|--------|---------------------|---------|
| **Claude Code** | Yes | Yes | Yes (PreToolUse) | **Full** |
| **Cursor** | Yes | Yes | — | MCP + Skills |
| **Windsurf** | Yes | — | — | MCP |
| **OpenCode** | Yes | Yes | — | MCP + Skills |

> **Claude Code** gets the deepest integration: MCP tools + agent skills + PreToolUse hooks that automatically enrich grep/glob/bash calls with knowledge graph context.

### Community Integrations

| Agent | Install | Source |
|-------|---------|--------|
| [pi](https://pi.dev) | `pi install npm:pi-soleil-ai-review-engine` | [pi-soleil-ai-review-engine](https://github.com/tintinweb/pi-soleil-ai-review-engine) |

## MCP Setup (manual)

If you prefer to configure manually instead of using `soleil-ai-review-engine setup`:

### Claude Code (full support — MCP + skills + hooks)

```bash
claude mcp add soleil-ai-review-engine -- npx -y soleil-ai-review-engine@latest mcp
```

### Cursor / Windsurf

Add to `~/.cursor/mcp.json` (global — works for all projects):

```json
{
  "mcpServers": {
    "soleil-ai-review-engine": {
      "command": "npx",
      "args": ["-y", "soleil-ai-review-engine@latest", "mcp"]
    }
  }
}
```

### OpenCode

Add to `~/.config/opencode/config.json`:

```json
{
  "mcp": {
    "soleil-ai-review-engine": {
      "command": "npx",
      "args": ["-y", "soleil-ai-review-engine@latest", "mcp"]
    }
  }
}
```

## How It Works

soleil-ai-review-engine builds a complete knowledge graph of your codebase through a multi-phase indexing pipeline:

1. **Structure** — Walks the file tree and maps folder/file relationships
2. **Parsing** — Extracts functions, classes, methods, and interfaces using Tree-sitter ASTs
3. **Resolution** — Resolves imports and function calls across files with language-aware logic
4. **Clustering** — Groups related symbols into functional communities
5. **Processes** — Traces execution flows from entry points through call chains
6. **Search** — Builds hybrid search indexes for fast retrieval

The result is a **LadybugDB graph database** stored locally in `.soleil-ai-review-engine/` with full-text search and semantic embeddings.

## MCP Tools

Your AI agent gets these tools automatically:

| Tool | What It Does | `repo` Param |
|------|-------------|--------------|
| `list_repos` | Discover all indexed repositories | — |
| `query` | Process-grouped hybrid search (BM25 + semantic + RRF) | Optional |
| `context` | 360-degree symbol view — categorized refs, process participation | Optional |
| `impact` | Blast radius analysis with depth grouping and confidence | Optional |
| `detect_changes` | Git-diff impact — maps changed lines to affected processes | Optional |
| `rename` | Multi-file coordinated rename with graph + text search | Optional |
| `cypher` | Raw Cypher graph queries | Optional |

> With one indexed repo, the `repo` param is optional. With multiple, specify which: `query({query: "auth", repo: "my-app"})`.

## MCP Resources

| Resource | Purpose |
|----------|---------|
| `soleil-ai-review-engine://repos` | List all indexed repositories (read first) |
| `soleil-ai-review-engine://repo/{name}/context` | Codebase stats, staleness check, and available tools |
| `soleil-ai-review-engine://repo/{name}/clusters` | All functional clusters with cohesion scores |
| `soleil-ai-review-engine://repo/{name}/cluster/{name}` | Cluster members and details |
| `soleil-ai-review-engine://repo/{name}/processes` | All execution flows |
| `soleil-ai-review-engine://repo/{name}/process/{name}` | Full process trace with steps |
| `soleil-ai-review-engine://repo/{name}/schema` | Graph schema for Cypher queries |

## MCP Prompts

| Prompt | What It Does |
|--------|-------------|
| `detect_impact` | Pre-commit change analysis — scope, affected processes, risk level |
| `generate_map` | Architecture documentation from the knowledge graph with mermaid diagrams |

## CLI Commands

```bash
soleil-ai-review-engine setup                    # Configure MCP for your editors (one-time)
soleil-ai-review-engine analyze [path]           # Index a repository (or update stale index)
soleil-ai-review-engine analyze --force          # Force full re-index
soleil-ai-review-engine analyze --embeddings     # Enable embedding generation (slower, better search)
soleil-ai-review-engine analyze --verbose        # Log skipped files when parsers are unavailable
soleil-ai-review-engine mcp                     # Start MCP server (stdio) — serves all indexed repos
soleil-ai-review-engine serve                   # Start local HTTP server (multi-repo) for web UI
soleil-ai-review-engine list                    # List all indexed repositories
soleil-ai-review-engine status                  # Show index status for current repo
soleil-ai-review-engine clean                   # Delete index for current repo
soleil-ai-review-engine clean --all --force     # Delete all indexes
soleil-ai-review-engine wiki [path]             # Generate LLM-powered docs from knowledge graph
soleil-ai-review-engine wiki --model <model>    # Wiki with custom LLM model (default: gpt-4o-mini)
```

## Multi-Repo Support

soleil-ai-review-engine supports indexing multiple repositories. Each `soleil-ai-review-engine analyze` registers the repo in a global registry (`~/.soleil-ai-review-engine/registry.json`). The MCP server serves all indexed repos automatically.

## Supported Languages

TypeScript, JavaScript, Python, Java, C, C++, C#, Go, Rust, PHP, Kotlin, Swift, Ruby

### Language Feature Matrix

| Language | Imports | Named Bindings | Exports | Heritage | Type Annotations | Constructor Inference | Config | Frameworks | Entry Points |
|----------|---------|----------------|---------|----------|-----------------|---------------------|--------|------------|-------------|
| TypeScript | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| JavaScript | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ |
| Python | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Java | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| Kotlin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| C# | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Go | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rust | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |
| PHP | ✓ | ✓ | ✓ | — | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ruby | ✓ | — | ✓ | ✓ | — | ✓ | — | ✓ | ✓ |
| Swift | — | — | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| C | — | — | ✓ | — | ✓ | ✓ | — | ✓ | ✓ |
| C++ | — | — | ✓ | ✓ | ✓ | ✓ | — | ✓ | ✓ |

**Imports** — cross-file import resolution · **Named Bindings** — `import { X as Y }` / re-export tracking · **Exports** — public/exported symbol detection · **Heritage** — class inheritance, interfaces, mixins · **Type Annotations** — explicit type extraction for receiver resolution · **Constructor Inference** — infer receiver type from constructor calls (`self`/`this` resolution included for all languages) · **Config** — language toolchain config parsing (tsconfig, go.mod, etc.) · **Frameworks** — AST-based framework pattern detection · **Entry Points** — entry point scoring heuristics

## Agent Skills

soleil-ai-review-engine ships with skill files that teach AI agents how to use the tools effectively:

- **Exploring** — Navigate unfamiliar code using the knowledge graph
- **Debugging** — Trace bugs through call chains
- **Impact Analysis** — Analyze blast radius before changes
- **Refactoring** — Plan safe refactors using dependency mapping

Installed automatically by both `soleil-ai-review-engine analyze` (per-repo) and `soleil-ai-review-engine setup` (global).

## Requirements

- Node.js >= 18
- Git repository (uses git for commit tracking)

## Privacy

- All processing happens locally on your machine
- No code is sent to any server
- Index stored in `.soleil-ai-review-engine/` inside your repo (gitignored)
- Global registry at `~/.soleil-ai-review-engine/` stores only paths and metadata

## Web UI

soleil-ai-review-engine also has a browser-based UI at [soleil-ai-review-engine.vercel.app](https://soleil-ai-review-engine.vercel.app) — 100% client-side, your code never leaves the browser.

**Local Backend Mode:** Run `soleil-ai-review-engine serve` and open the web UI locally — it auto-detects the server and shows all your indexed repos, with full AI chat support. No need to re-upload or re-index. The agent's tools (Cypher queries, search, code navigation) route through the backend HTTP API automatically.

## License

[PolyForm Noncommercial 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0/)

Free for non-commercial use. Contact for commercial licensing.
