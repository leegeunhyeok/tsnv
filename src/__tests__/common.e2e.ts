import fs from 'node:fs';
import path from 'node:path';

import { glob } from 'tinyglobby';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Shell } from 'zx';

import { createFixture, createFixtureApp, cleanupFixture, type Fixture } from './testing-utils';

const PACKED_PACKAGE_PATH = 'package.tgz';
const EXPECTED_ASSET_FILES = [
  'badge.android.svg',
  'badge.ios.svg',
  'badge.svg',
  'badge@2x.android.svg',
  'badge@2x.ios.svg',
  'badge@2x.svg',
  'badge@3x.android.svg',
  'badge@3x.ios.svg',
  'badge@3x.svg',
  'badge@4x.android.svg',
  'badge@4x.ios.svg',
  'badge@4x.svg',
  'icons/mark.svg',
  'image.android.png',
  'image.ios.png',
].sort();

describe('tsnv', () => {
  describe.sequential('ESModule', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('esm');
      $ = fixture.$;
    });

    afterAll(async () => {
      await cleanupFixture();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $`yarn pack --out ${PACKED_PACKAGE_PATH} --json`;

      // JavaScript
      expect(stdout).toContain('features/device/device-name.android.js');
      expect(stdout).toContain('features/device/device-name.ios.js');
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');
      expect(stdout).toContain('utils/format-greeting.js');

      // Source maps
      expect(stdout).toContain('features/device/device-name.android.js.map');
      expect(stdout).toContain('greeting.ios.js.map');

      // Types
      expect(stdout).toContain('features/device/device-name.d.ts');
      expect(stdout).toContain('greeting.d.ts');
      expect(stdout).toContain('index.d.ts');
      expect(stdout).toContain('types.d.ts');
      expect(stdout).toContain('utils/format-greeting.d.ts');
    });

    it.sequential('should build a package and run it by platform', async () => {
      const app = await createFixtureApp();
      const entryFilePath = path.join(app.fixtureDir, 'src', 'index.ts');
      const packageFilePath = path.join(fixture.fixtureDir, PACKED_PACKAGE_PATH);
      const packageName = JSON.parse(
        await fs.promises.readFile(path.join(fixture.fixtureDir, 'package.json'), 'utf-8'),
      ).name;
      await app.$({ stdio: 'inherit' })`yarn add ${packageName}@${packageFilePath}`;

      await fs.promises.writeFile(
        entryFilePath,
        [
          `import { deviceName, formatGreeting, greeting } from '${packageName}';`,
          `console.log(greeting());`,
          `console.log(deviceName());`,
          `console.log(formatGreeting({ prefix: 'Welcome' }));`,
        ].join('\n'),
      );

      // Check TypeScript compilation
      const { exitCode: tscExitCode } = await app.$({ nothrow: true })`yarn tsc --noEmit`;
      expect(tscExitCode).toBe(0);

      const androidBuild = await app.$`yarn build:android`;
      const iosBuild = await app.$`yarn build:ios`;
      expect(androidBuild.exitCode, androidBuild.stdout + androidBuild.stderr).toBe(0);
      expect(iosBuild.exitCode, iosBuild.stdout + iosBuild.stderr).toBe(0);

      const { stdout: androidStdout } = await app.$`node dist/bundle.android.js`;
      expect(androidStdout).toContain('Hello, Android!');
      expect(androidStdout).toContain('android-device');
      expect(androidStdout).toContain('Welcome: Hello, Android!');
      const { stdout: iosStdout } = await app.$`node dist/bundle.ios.js`;
      expect(iosStdout).toContain('Hello, iOS!');
      expect(iosStdout).toContain('ios-device');
      expect(iosStdout).toContain('Welcome: Hello, iOS!');
    });
  });

  describe.sequential('Assets', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('asset');
      $ = fixture.$;
    });

    afterAll(async () => {
      await cleanupFixture();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should copy only referenced asset variants to the destination', async () => {
      const sourceDir = path.join(fixture.fixtureDir, 'src', 'assets');
      const destinationDir = path.join(fixture.fixtureDir, 'dist', '_assets', 'src', 'assets');
      const generatedAssets = (await glob('**/*', { cwd: destinationDir, onlyFiles: true })).sort();

      expect(generatedAssets).toEqual(EXPECTED_ASSET_FILES);

      for (const asset of EXPECTED_ASSET_FILES) {
        const [source, destination] = await Promise.all([
          fs.promises.readFile(path.join(sourceDir, asset)),
          fs.promises.readFile(path.join(destinationDir, asset)),
        ]);
        expect(destination, asset).toEqual(source);
      }
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $`yarn pack --out ${PACKED_PACKAGE_PATH} --json`;

      // Assets & JavaScript
      for (const asset of EXPECTED_ASSET_FILES) {
        expect(stdout).toContain(`_assets/src/assets/${asset}`);
      }
      expect(stdout).toContain('index.js');
      expect(stdout).toContain('library-assets.js');
      expect(stdout).not.toContain('badge.unused.svg');

      // Types
      expect(stdout).toContain('index.d.ts');
      expect(stdout).toContain('library-assets.d.ts');
    });
  });

  describe.sequential('Yarn PnP', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('esm', { pnp: true });
      $ = fixture.$;
    });

    afterAll(async () => {
      await cleanupFixture();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $`yarn pack --out ${PACKED_PACKAGE_PATH} --json`;

      // JavaScript
      expect(stdout).toContain('features/device/device-name.android.js');
      expect(stdout).toContain('features/device/device-name.ios.js');
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');
      expect(stdout).toContain('utils/format-greeting.js');

      // Types
      expect(stdout).toContain('features/device/device-name.d.ts');
      expect(stdout).toContain('greeting.d.ts');
      expect(stdout).toContain('index.d.ts');
      expect(stdout).toContain('types.d.ts');
      expect(stdout).toContain('utils/format-greeting.d.ts');
    });
  });
});
