import { describe, expect, it, vi, vitest } from 'vitest';
import type { ResolvedConfig } from '../config/default';
import { hasPlatformSpecificModule, isDts, resolveFilename } from './path';

describe('path', () => {
  describe('hasPlatformSpecificModule', () => {
    vitest.mock('node:fs', () => {
      const mockedFs = {
        promises: {
          readdir: vi.fn().mockResolvedValue([
            { isFile: () => true, name: 'index.android.ts' },
            { isFile: () => true, name: 'index.ios.ts' },
            { isFile: () => true, name: 'index.ios.ts' },
          ]),
        },
      };

      return { default: mockedFs };
    });

    it('should return true if the platform specific module is exists', async () => {
      expect(
        await hasPlatformSpecificModule('./index', 'root', {
          specifiers: ['android', 'ios', 'native'],
        } as ResolvedConfig),
      ).toBe(true);
      expect(await hasPlatformSpecificModule('./index', 'root', { specifiers: ['foo', 'bar'] } as ResolvedConfig)).toBe(
        false,
      );
    });
  });

  describe('resolveFilename', () => {
    it('should resolve the filename', () => {
      expect(resolveFilename('esm', 'esm')).toBe('[name].js');
      expect(resolveFilename('cjs', 'cjs')).toBe('[name].js');
      expect(resolveFilename('cjs', 'esm')).toBe('[name].mjs');
      expect(resolveFilename('esm', 'cjs')).toBe('[name].cjs');
    });
  });

  describe('isDts', () => {
    it('should return true if the filename is a d.ts', () => {
      expect(isDts('index.d.ts')).toBe(true);
      expect(isDts('index.ts')).toBe(false);
    });
  });
});
