import { describe, expect, it } from 'vitest';

import { resolvePackageType } from './context';

describe('context', () => {
  describe('resolvePackageType', () => {
    it('should resolve the package type', () => {
      expect(resolvePackageType({})).toBe('cjs');
      expect(
        resolvePackageType({
          type: 'commonjs',
        }),
      ).toBe('cjs');
      expect(
        resolvePackageType({
          type: 'module',
        }),
      ).toBe('esm');
    });
  });
});
