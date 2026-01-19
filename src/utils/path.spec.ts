import { describe, expect, it, vi, vitest } from 'vitest';

import type { ResolvedConfig } from '../config/default';
import {
  getUniquePlatformSpecificFiles,
  hasPlatformSpecificModule,
  isDts,
  isPlatformSpecificFile,
  removePlatformSpecificExtension,
  resolveFilename,
} from './path';

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
      expect(
        await hasPlatformSpecificModule('./index', 'root', {
          specifiers: ['foo', 'bar'],
        } as ResolvedConfig),
      ).toBe(false);
    });
  });

  describe('resolveFilename', () => {
    it('should resolve the filename', () => {
      expect(resolveFilename()).toBe('[name].js');
    });
  });

  describe('isDts', () => {
    it('should return true if the filename is a d.ts', () => {
      expect(isDts('index.d.ts')).toBe(true);
      expect(isDts('index.ts')).toBe(false);
    });
  });

  describe('isPlatformSpecificFile', () => {
    it('should return true if the filename is a platform specific file', () => {
      const extensions = ['ts', 'tsx', 'js', 'jsx', 'json'];
      const specifiers = ['android', 'ios', 'native'];
      expect(isPlatformSpecificFile('index.android.ts', extensions, specifiers)).toBe(true);
      expect(isPlatformSpecificFile('index.ios.ts', extensions, specifiers)).toBe(true);
      expect(isPlatformSpecificFile('index.native.ts', extensions, specifiers)).toBe(true);
      expect(isPlatformSpecificFile('index.ts', extensions, specifiers)).toBe(false);
    });
  });

  describe('removePlatformSpecificExtension', () => {
    it('should remove the platform specific extension from the filename', () => {
      const extensions = ['ts', 'tsx', 'js', 'jsx', 'json'];
      const specifiers = ['android', 'ios', 'native'];
      expect(removePlatformSpecificExtension('index.android.ts', extensions, specifiers)).toBe(
        'index.ts',
      );
      expect(removePlatformSpecificExtension('index.ios.ts', extensions, specifiers)).toBe(
        'index.ts',
      );
      expect(removePlatformSpecificExtension('index.native.ts', extensions, specifiers)).toBe(
        'index.ts',
      );
      expect(removePlatformSpecificExtension('index.ts', extensions, specifiers)).toBe('index.ts');
      expect(removePlatformSpecificExtension('index.test.ts', extensions, specifiers)).toBe(
        'index.test.ts',
      );
      expect(removePlatformSpecificExtension('index.android.d.ts', extensions, specifiers)).toBe(
        'index.android.ts',
      );
    });
  });

  describe('getUniquePlatformSpecificFiles', () => {
    it('should return unique platform specific files', () => {
      const files = [
        // root level
        'index.android.ts',
        'index.ios.ts',
        'index.native.ts',
        'index.ts',
        'utils.android.ts',
        'utils.ios.ts',
        'utils.ts',
        'constants.ts',

        // src directory
        'src/index.android.ts',
        'src/index.ios.ts',
        'src/index.native.ts',
        'src/index.ts',
        'src/helpers.android.tsx',
        'src/helpers.ios.tsx',
        'src/helpers.tsx',
        'src/types.ts',

        // nested directory
        'src/components/Button.android.tsx',
        'src/components/Button.ios.tsx',
        'src/components/Button.tsx',
        'src/components/Icon.android.ts',
        'src/components/Icon.ios.ts',
        'src/components/Header.tsx',

        // utils directory
        'src/utils/platform.android.ts',
        'src/utils/platform.ios.ts',
        'src/utils/platform.native.ts',
        'src/utils/format.ts',

        // js files
        'legacy/app.android.js',
        'legacy/app.ios.js',
        'legacy/app.js',
        'legacy/config.js',

        // edge cases
        'android.config.ts',
        'ios.settings.ts',
        'src/android/index.ts',
        'src/ios/index.ts',
      ];
      const extensions = ['ts', 'tsx', 'js', 'jsx', 'json'];
      const specifiers = ['android', 'ios', 'native'];

      expect(getUniquePlatformSpecificFiles(files, extensions, specifiers)).toEqual([
        'index.android.ts',
        'utils.android.ts',
        'constants.ts',
        'src/index.android.ts',
        'src/helpers.android.tsx',
        'src/types.ts',
        'src/components/Button.android.tsx',
        'src/components/Icon.android.ts',
        'src/components/Header.tsx',
        'src/utils/platform.android.ts',
        'src/utils/format.ts',
        'legacy/app.android.js',
        'legacy/config.js',
        'android.config.ts',
        'ios.settings.ts',
        'src/android/index.ts',
        'src/ios/index.ts',
      ]);
    });
  });
});
