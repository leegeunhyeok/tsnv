import { describe, expect, it } from 'vitest';

import { resolveDeclarationCompiler } from './generate-declarations';

describe('resolveDeclarationCompiler', () => {
  it('uses the official TypeScript compiler by default', () => {
    expect(resolveDeclarationCompiler(false, '7.0')).toBe('tsc');
  });

  it('uses the official TypeScript 7 native compiler for tsgo builds', () => {
    expect(resolveDeclarationCompiler(true, '7.0')).toBe('tsc');
  });

  it('keeps native-preview compatibility for older TypeScript versions', () => {
    expect(resolveDeclarationCompiler(true, '6.0')).toBe('tsgo');
    expect(resolveDeclarationCompiler(true, undefined)).toBe('tsgo');
  });
});
