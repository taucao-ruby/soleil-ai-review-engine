import { describe, expect, it } from 'vitest';
import { ALLOWED_CYPHER_LABELS, validateCypherLabel } from './tools';

describe('validateCypherLabel', () => {
  it('accepts supported core labels', () => {
    expect(validateCypherLabel('File')).toBe('File');
    expect(validateCypherLabel('Function')).toBe('Function');
  });

  it('accepts repository-specific graph labels that are part of the allowlist', () => {
    expect(ALLOWED_CYPHER_LABELS.has('Project')).toBe(true);
    expect(validateCypherLabel('Project')).toBe('Project');
  });

  it('rejects invalid or injected labels', () => {
    expect(() => validateCypherLabel('File) MATCH (evil')).toThrow(/Invalid Cypher label/);
    expect(() => validateCypherLabel('')).toThrow(/Invalid Cypher label/);
  });
});
