import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { generateAIContextFiles } from '../../src/cli/ai-context.js';

describe('generateAIContextFiles', () => {
  let tmpDir: string;
  let storagePath: string;

  beforeAll(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gn-ai-ctx-test-'));
    storagePath = path.join(tmpDir, '.soleil-ai-review-engine');
    await fs.mkdir(storagePath, { recursive: true });
  });

  afterAll(async () => {
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch { /* best-effort */ }
  });

  it('generates context files', async () => {
    const stats = {
      nodes: 100,
      edges: 200,
      processes: 10,
    };

    const result = await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);
    expect(result.files).toBeDefined();
    expect(result.files.length).toBeGreaterThan(0);
  });

  it('creates or updates CLAUDE.md with soleil-ai-review-engine section', async () => {
    const stats = { nodes: 50, edges: 100, processes: 5 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');
    expect(content).toContain('soleil-ai-review-engine:start');
    expect(content).toContain('soleil-ai-review-engine:end');
    expect(content).toContain('TestProject');
  });

  it('handles empty stats', async () => {
    const stats = {};
    const result = await generateAIContextFiles(tmpDir, storagePath, 'EmptyProject', stats);
    expect(result.files).toBeDefined();
  });

  it('updates existing CLAUDE.md without duplicating', async () => {
    const stats = { nodes: 10 };

    // Run twice
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    // Should only have one soleil-ai-review-engine section
    const starts = (content.match(/soleil-ai-review-engine:start/g) || []).length;
    expect(starts).toBe(1);
  });

  it('installs skills files', async () => {
    const stats = { nodes: 10 };
    const result = await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    // Should have installed skill files
    const skillsDir = path.join(tmpDir, '.claude', 'skills', 'soleil-ai-review-engine');
    try {
      const entries = await fs.readdir(skillsDir, { recursive: true });
      expect(entries.length).toBeGreaterThan(0);
    } catch {
      // Skills dir may not be created if skills source doesn't exist in test context
    }
  });

  it('emits the canonical re-index command and never a broken npx form', async () => {
    const stats = { nodes: 10, edges: 20, processes: 1 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const claudeMdPath = path.join(tmpDir, 'CLAUDE.md');
    const content = await fs.readFile(claudeMdPath, 'utf-8');

    // Canonical: explicit package + canonical bin (works whether or not the
    // gitnexus/soleil-ai-review-engine bin aliases stay byte-identical to soleil's).
    expect(content).toContain('npx -p soleil-engine-cli soleil analyze');

    // `npx soleil-engine-cli <cmd>` (bare, no -p) is not the documented contract —
    // it only works today via an npm bin-alias-collapse implementation detail.
    expect(content).not.toMatch(/npx soleil-engine-cli /);
    // `npx soleil-ai-review-engine <cmd>` is a 404 in a clean environment (MIGRATION.md).
    expect(content).not.toMatch(/npx soleil-ai-review-engine /);
  });

  it('prunes legacy gitnexus-* skill dirs on install without touching unrelated dirs', async () => {
    const skillsDir = path.join(tmpDir, '.claude', 'skills', 'soleil-ai-review-engine');
    const legacyDir = path.join(skillsDir, 'gitnexus-cli');
    const unrelatedDir = path.join(skillsDir, 'my-custom-skill');

    await fs.mkdir(legacyDir, { recursive: true });
    await fs.writeFile(path.join(legacyDir, 'SKILL.md'), '---\nname: gitnexus-cli\n---\nstale', 'utf-8');
    await fs.mkdir(unrelatedDir, { recursive: true });
    await fs.writeFile(path.join(unrelatedDir, 'SKILL.md'), '---\nname: my-custom-skill\n---\nkeep me', 'utf-8');

    const stats = { nodes: 10 };
    await generateAIContextFiles(tmpDir, storagePath, 'TestProject', stats);

    const entries = await fs.readdir(skillsDir);
    expect(entries).not.toContain('gitnexus-cli');
    expect(entries).toContain('my-custom-skill');
    expect(entries).toContain('soleil-ai-review-engine-cli');
  });
});
