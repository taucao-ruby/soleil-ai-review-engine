import { describe, expect, it } from 'vitest';
import { normalizeServerUrl } from './server-connection';

describe('normalizeServerUrl', () => {
  it('adds https and /api for non-local hosts', () => {
    expect(normalizeServerUrl(' soleil-ai-review-engine.example.com ')).toBe('https://soleil-ai-review-engine.example.com/api');
  });

  it('uses http for localhost addresses and strips trailing slashes', () => {
    expect(normalizeServerUrl('localhost:4747///')).toBe('http://localhost:4747/api');
    expect(normalizeServerUrl('127.0.0.1:8080/')).toBe('http://127.0.0.1:8080/api');
  });

  it('does not append /api twice when it is already present', () => {
    expect(normalizeServerUrl('https://example.com/api')).toBe('https://example.com/api');
  });
});
