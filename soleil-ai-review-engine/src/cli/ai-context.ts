/**
 * AI Context Generator
 * 
 * Creates AGENTS.md and CLAUDE.md with full inline soleil-ai-review-engine context.
 * AGENTS.md is the standard read by Cursor, Windsurf, OpenCode, Cline, etc.
 * CLAUDE.md is for Claude Code which only reads that file.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { type GeneratedSkillInfo } from './skill-gen.js';
import type { SkillPack } from '../skills/skill-pack.js';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_COMMAND = 'soleil';
const NPM_PACKAGE = 'soleil-engine-cli';

interface RepoStats {
  files?: number;
  nodes?: number;
  edges?: number;
  communities?: number;
  clusters?: number;       // Aggregated cluster count (what tools show)
  processes?: number;
}

const SOLEIL_AI_REVIEW_ENGINE_START_MARKER = '<!-- soleil-ai-review-engine:start -->';
const SOLEIL_AI_REVIEW_ENGINE_END_MARKER = '<!-- soleil-ai-review-engine:end -->';

/**
 * Generate the full soleil-ai-review-engine context content.
 *
 * Design principles (learned from real agent behavior and industry research):
 * - Inline critical workflows — skills are skipped 56% of the time (Vercel eval data)
 * - Use RFC 2119 language (MUST, NEVER, ALWAYS) — models follow imperative rules
 * - Three-tier boundaries (Always/When/Never) — proven to change model behavior
 * - Keep under 120 lines — adherence degrades past 150 lines
 * - Exact tool commands with parameters — vague directives get ignored
 * - Self-review checklist — forces model to verify its own work
 */
function generateSoleilAiReviewEngineContent(projectName: string, stats: RepoStats, generatedSkills?: GeneratedSkillInfo[]): string {
  const generatedRows = (generatedSkills && generatedSkills.length > 0)
    ? generatedSkills.map(s =>
        `| Work in the ${s.label} area (${s.symbolCount} symbols) | \`.claude/skills/generated/${s.name}/SKILL.md\` |`
      ).join('\n')
    : '';

  const skillsTable = `| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-exploring/SKILL.md\` |
| Blast radius / "What breaks if I change X?" | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-impact-analysis/SKILL.md\` |
| Trace bugs / "Why is X failing?" | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-debugging/SKILL.md\` |
| Rename / extract / split / refactor | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-refactoring/SKILL.md\` |
| Tools, resources, schema reference | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-guide/SKILL.md\` |
| Index, status, clean, wiki CLI commands | \`.claude/skills/soleil-ai-review-engine/soleil-ai-review-engine-cli/SKILL.md\` |${generatedRows ? '\n' + generatedRows : ''}`;

  return `${SOLEIL_AI_REVIEW_ENGINE_START_MARKER}
# soleil-ai-review-engine — Code Intelligence

This project is indexed by soleil-ai-review-engine as **${projectName}** (${stats.nodes || 0} symbols, ${stats.edges || 0} relationships, ${stats.processes || 0} execution flows). Use the soleil-ai-review-engine MCP tools to understand code, assess impact, and navigate safely.

> If any soleil-ai-review-engine tool warns the index is stale, run \`npx ${NPM_PACKAGE} analyze\` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run \`soleil-ai-review-engine_impact({target: "symbolName", direction: "upstream"})\` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run \`soleil-ai-review-engine_detect_changes()\` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use \`soleil-ai-review-engine_query({query: "concept"})\` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use \`soleil-ai-review-engine_context({name: "symbolName"})\`.

## When Debugging

1. \`soleil-ai-review-engine_query({query: "<error or symptom>"})\` — find execution flows related to the issue
2. \`soleil-ai-review-engine_context({name: "<suspect function>"})\` — see all callers, callees, and process participation
3. \`READ soleil-ai-review-engine://repo/${projectName}/process/{processName}\` — trace the full execution flow step by step
4. For regressions: \`soleil-ai-review-engine_detect_changes({scope: "compare", base_ref: "main"})\` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use \`soleil-ai-review-engine_rename({symbol_name: "old", new_name: "new", dry_run: true})\` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with \`dry_run: false\`.
- **Extracting/Splitting**: MUST run \`soleil-ai-review-engine_context({name: "target"})\` to see all incoming/outgoing refs, then \`soleil-ai-review-engine_impact({target: "target", direction: "upstream"})\` to find all external callers before moving code.
- After any refactor: run \`soleil-ai-review-engine_detect_changes({scope: "all"})\` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running \`soleil-ai-review-engine_impact\` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use \`soleil-ai-review-engine_rename\` which understands the call graph.
- NEVER commit changes without running \`soleil-ai-review-engine_detect_changes()\` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| \`query\` | Find code by concept | \`soleil-ai-review-engine_query({query: "auth validation"})\` |
| \`context\` | 360-degree view of one symbol | \`soleil-ai-review-engine_context({name: "validateUser"})\` |
| \`impact\` | Blast radius before editing | \`soleil-ai-review-engine_impact({target: "X", direction: "upstream"})\` |
| \`detect_changes\` | Pre-commit scope check | \`soleil-ai-review-engine_detect_changes({scope: "staged"})\` |
| \`rename\` | Safe multi-file rename | \`soleil-ai-review-engine_rename({symbol_name: "old", new_name: "new", dry_run: true})\` |
| \`cypher\` | Custom graph queries | \`soleil-ai-review-engine_cypher({query: "MATCH ..."})\` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| \`soleil-ai-review-engine://repo/${projectName}/context\` | Codebase overview, check index freshness |
| \`soleil-ai-review-engine://repo/${projectName}/clusters\` | All functional areas |
| \`soleil-ai-review-engine://repo/${projectName}/processes\` | All execution flows |
| \`soleil-ai-review-engine://repo/${projectName}/process/{name}\` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. \`soleil-ai-review-engine_impact\` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. \`soleil-ai-review-engine_detect_changes()\` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the soleil-ai-review-engine index becomes stale. Re-run analyze to update it:

\`\`\`bash
npx ${NPM_PACKAGE} analyze
\`\`\`

If the index previously included embeddings, preserve them by adding \`--embeddings\`:

\`\`\`bash
npx ${NPM_PACKAGE} analyze --embeddings
\`\`\`

To check whether embeddings exist, inspect \`.soleil-ai-review-engine/meta.json\` — the \`stats.embeddings\` field shows the count (0 means no embeddings). **Running analyze without \`--embeddings\` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after \`git commit\` and \`git merge\`.

## CLI

${skillsTable}

${SOLEIL_AI_REVIEW_ENGINE_END_MARKER}`;
}


/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create or update soleil-ai-review-engine section in a file
 * - If file doesn't exist: create with soleil-ai-review-engine content
 * - If file exists without soleil-ai-review-engine section: append
 * - If file exists with soleil-ai-review-engine section: replace that section
 */
async function upsertSoleilAiReviewEngineSection(
  filePath: string,
  content: string
): Promise<'created' | 'updated' | 'appended'> {
  const exists = await fileExists(filePath);

  if (!exists) {
    await fs.writeFile(filePath, content, 'utf-8');
    return 'created';
  }

  const existingContent = await fs.readFile(filePath, 'utf-8');

  // Check if soleil-ai-review-engine section already exists
  const startIdx = existingContent.indexOf(SOLEIL_AI_REVIEW_ENGINE_START_MARKER);
  const endIdx = existingContent.indexOf(SOLEIL_AI_REVIEW_ENGINE_END_MARKER);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    // Replace existing section
    const before = existingContent.substring(0, startIdx);
    const after = existingContent.substring(endIdx + SOLEIL_AI_REVIEW_ENGINE_END_MARKER.length);
    const newContent = before + content + after;
    await fs.writeFile(filePath, newContent.trim() + '\n', 'utf-8');
    return 'updated';
  }

  // Append new section
  const newContent = existingContent.trim() + '\n\n' + content + '\n';
  await fs.writeFile(filePath, newContent, 'utf-8');
  return 'appended';
}

/**
 * Install soleil-ai-review-engine skills to .claude/skills/soleil-ai-review-engine/
 * Works natively with Claude Code, Cursor, and GitHub Copilot
 */
async function installSkills(repoPath: string): Promise<string[]> {
  const skillsDir = path.join(repoPath, '.claude', 'skills', 'soleil-ai-review-engine');
  const installedSkills: string[] = [];

  // Skill definitions bundled with the package
  const skills: SkillPack['skills'] = [
    {
      name: 'soleil-ai-review-engine-exploring',
      description: 'Use when the user asks how code works, wants to understand architecture, trace execution flows, or explore unfamiliar parts of the codebase. Examples: "How does X work?", "What calls this function?", "Show me the auth flow"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-exploring.md' },
    },
    {
      name: 'soleil-ai-review-engine-debugging',
      description: 'Use when the user is debugging a bug, tracing an error, or asking why something fails. Examples: "Why is X failing?", "Where does this error come from?", "Trace this bug"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-debugging.md' },
    },
    {
      name: 'soleil-ai-review-engine-impact-analysis',
      description: 'Use when the user wants to know what will break if they change something, or needs safety analysis before editing code. Examples: "Is it safe to change X?", "What depends on this?", "What will break?"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-impact-analysis.md' },
    },
    {
      name: 'soleil-ai-review-engine-refactoring',
      description: 'Use when the user wants to rename, extract, split, move, or restructure code safely. Examples: "Rename this function", "Extract this into a module", "Refactor this class", "Move this to a separate file"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-refactoring.md' },
    },
    {
      name: 'soleil-ai-review-engine-guide',
      description: 'Use when the user asks about soleil-ai-review-engine itself — available tools, how to query the knowledge graph, MCP resources, graph schema, or workflow reference. Examples: "What soleil-ai-review-engine tools are available?", "How do I use soleil-ai-review-engine?"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-guide.md' },
    },
    {
      name: 'soleil-ai-review-engine-cli',
      description: 'Use when the user needs to run soleil-ai-review-engine CLI commands like analyze/index a repo, check status, clean the index, generate a wiki, or list indexed repos. Examples: "Index this repo", "Reanalyze the codebase", "Generate a wiki"',
      source: { kind: 'file', relativePath: 'soleil-ai-review-engine-cli.md' },
    },
  ];

  for (const skill of skills) {
    const skillDir = path.join(skillsDir, skill.name);
    const skillPath = path.join(skillDir, 'SKILL.md');

    try {
      // Create skill directory
      await fs.mkdir(skillDir, { recursive: true });

      // Try to read from package skills directory
      const packageSkillPath = path.join(__dirname, '..', '..', 'skills', skill.source.relativePath);
      let skillContent: string;

      try {
        skillContent = await fs.readFile(packageSkillPath, 'utf-8');
      } catch {
        // Fallback: generate minimal skill content
        skillContent = `---
name: ${skill.name}
description: ${skill.description}
---

# ${skill.name.charAt(0).toUpperCase() + skill.name.slice(1)}

${skill.description}

Use soleil-ai-review-engine tools to accomplish this task.
`;
      }

      await fs.writeFile(skillPath, skillContent, 'utf-8');
      installedSkills.push(skill.name);
    } catch (err) {
      // Skip on error, don't fail the whole process
      console.warn(`Warning: Could not install skill ${skill.name}:`, err);
    }
  }

  return installedSkills;
}

/**
 * Generate AI context files after indexing
 */
export async function generateAIContextFiles(
  repoPath: string,
  _storagePath: string,
  projectName: string,
  stats: RepoStats,
  generatedSkills?: GeneratedSkillInfo[]
): Promise<{ files: string[] }> {
  const content = generateSoleilAiReviewEngineContent(projectName, stats, generatedSkills);
  const createdFiles: string[] = [];

  // Create AGENTS.md (standard for Cursor, Windsurf, OpenCode, Cline, etc.)
  const agentsPath = path.join(repoPath, 'AGENTS.md');
  const agentsResult = await upsertSoleilAiReviewEngineSection(agentsPath, content);
  createdFiles.push(`AGENTS.md (${agentsResult})`);

  // Create CLAUDE.md (for Claude Code)
  const claudePath = path.join(repoPath, 'CLAUDE.md');
  const claudeResult = await upsertSoleilAiReviewEngineSection(claudePath, content);
  createdFiles.push(`CLAUDE.md (${claudeResult})`);

  // Install skills to .claude/skills/soleil-ai-review-engine/
  const installedSkills = await installSkills(repoPath);
  if (installedSkills.length > 0) {
    createdFiles.push(`.claude/skills/soleil-ai-review-engine/ (${installedSkills.length} skills)`);
  }

  return { files: createdFiles };
}
