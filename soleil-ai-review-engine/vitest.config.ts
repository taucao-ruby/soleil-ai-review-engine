import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: ['test/global-setup.ts'],
    include: ['test/**/*.test.ts'],
    testTimeout: 30000,
    pool: 'forks',
    // LadybugDB enforces exclusive file locks on Windows, so the shared test DB
    // (test/global-setup.ts) can't be opened by parallel fork processes — they
    // collide with "Could not set lock on file". Serialize files on Windows so
    // each file's fork exits and releases the lock before the next starts.
    // Linux/macOS allow concurrent opens, so keep parallelism there (fast CI).
    fileParallelism: process.platform !== 'win32',
    globals: true,
    setupFiles: ['test/setup.ts'],
    teardownTimeout: 3000,
    dangerouslyIgnoreUnhandledErrors: true, // LadybugDB N-API destructor segfaults on fork exit — not a test failure
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/cli/index.ts',          // CLI entry point (commander wiring)
        'src/server/**',              // HTTP server (requires network)
        'src/core/wiki/**',           // Wiki generation (requires LLM)
      ],
      // Auto-ratchet: vitest bumps thresholds when coverage exceeds them.
      // CI will fail if a PR drops below these floors.
      thresholds: {
        statements: 26,
        branches: 23,
        functions: 28,
        lines: 27,
        autoUpdate: true,
      },
    },
  },
});
