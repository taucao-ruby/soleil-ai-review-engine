import path from 'path';
import { describe, it, expect, vi } from 'vitest';
import { getMcpEntry, setupClaudeCode } from '../../src/cli/setup.js';

describe('getMcpEntry', () => {
  it('spawns this install\'s own built CLI directly with node, never npx', () => {
    const entry = getMcpEntry();

    expect(entry.command).toBe('node');
    expect(entry.args[1]).toBe('mcp');
    // Resolved relative to setup's own directory (dist/cli in a real install,
    // src/cli when this test imports the TS source directly) — never a bare
    // package name that would need registry resolution.
    expect(path.isAbsolute(entry.args[0])).toBe(true);
    expect(entry.args[0]).toMatch(/\/cli\/index\.js$/);

    const serialized = JSON.stringify(entry);
    // Unpublished package: `npx ...@latest` 404s for anyone without a prior
    // local/global install (see MIGRATION.md "what is not decided yet").
    expect(serialized).not.toContain('npx');
    expect(serialized).not.toContain('@latest');
    expect(serialized).not.toContain('soleil-engine-cli');
  });
});

describe('setupClaudeCode', () => {
  it('prints the same node-based command as getMcpEntry, never a bare/broken npx form', async () => {
    const logs: string[] = [];
    const logSpy = vi.spyOn(console, 'log').mockImplementation((msg?: unknown) => {
      logs.push(String(msg ?? ''));
    });

    try {
      await setupClaudeCode({ configured: [], skipped: [], errors: [] });
    } finally {
      logSpy.mockRestore();
    }

    const output = logs.join('\n');
    if (output.includes('not installed')) {
      // No ~/.claude on this machine — nothing was printed to check.
      return;
    }

    const entry = getMcpEntry();
    expect(output).toContain(`node ${entry.args[0]} mcp`);
    expect(output).not.toMatch(/npx soleil-engine-cli /);
    expect(output).not.toContain('@latest');
  });
});
