import { describe, expect, it } from 'vitest';
import { parseGitHubUrl } from './git-clone';

describe('parseGitHubUrl', () => {
  it('parses https GitHub URLs and removes the .git suffix', () => {
    expect(parseGitHubUrl('https://github.com/openai/gpt-oss.git')).toEqual({
      owner: 'openai',
      repo: 'gpt-oss',
    });
  });

  it('parses bare github.com URLs after trimming whitespace', () => {
    expect(parseGitHubUrl('  github.com/vercel/next.js  ')).toEqual({
      owner: 'vercel',
      repo: 'next.js',
    });
  });

  it('returns null for malformed or incomplete repository URLs', () => {
    expect(parseGitHubUrl('https://github.com/openai')).toBeNull();
    expect(parseGitHubUrl('not-a-url')).toBeNull();
  });
});
