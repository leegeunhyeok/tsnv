import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import stripAnsi from 'strip-ansi';
import { glob } from 'tinyglobby';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Shell } from 'zx';

import { createFixture, createFixtureApp, cleanupFixture, type Fixture } from './testing-utils';

const PACKED_PACKAGE_PATH = 'package.tgz';
const LARGE_FIXTURE_MODULE_COUNT = 1_000;
const LARGE_FIXTURE_TOTAL = (LARGE_FIXTURE_MODULE_COUNT * (LARGE_FIXTURE_MODULE_COUNT + 1)) / 2;
const LARGE_FIXTURE_MODULES_PER_AXIS = 10;
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

async function generateLargeModuleTree(fixtureDir: string) {
  const sourceDir = path.join(fixtureDir, 'src');
  const imports: string[] = [];
  const values: string[] = [];
  let moduleIndex = 0;

  for (let first = 0; first < LARGE_FIXTURE_MODULES_PER_AXIS; first++) {
    const writes: Promise<void>[] = [];

    for (let second = 0; second < LARGE_FIXTURE_MODULES_PER_AXIS; second++) {
      for (let third = 0; third < LARGE_FIXTURE_MODULES_PER_AXIS; third++) {
        const value = ++moduleIndex;
        const segments = [first, second, third].map((segment) =>
          segment.toString().padStart(2, '0'),
        );
        const relativeDir = path.posix.join('modules', ...segments);
        const moduleDir = path.join(sourceDir, 'modules', ...segments);
        const identifier = `value${value}`;

        imports.push(`import ${identifier} from './${relativeDir}/value';`);
        values.push(identifier);
        writes.push(
          fs.promises
            .mkdir(moduleDir, { recursive: true })
            .then(() =>
              fs.promises.writeFile(
                path.join(moduleDir, 'value.ts'),
                `const value: number = ${value};\n\nexport default value;\n`,
              ),
            ),
        );
      }
    }

    await Promise.all(writes);
  }

  await fs.promises.writeFile(
    path.join(sourceDir, 'index.ts'),
    `${imports.join('\n')}\n\nexport const total: number = [${values.join(', ')}].reduce(\n  (sum, value) => sum + value,\n  0,\n);\n`,
  );
}

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

  describe.sequential('Large module tree', () => {
    let fixture: Fixture;
    let $: Shell;
    let buildDurationMs = 0;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('large');
      $ = fixture.$;
      await generateLargeModuleTree(fixture.fixtureDir);
    });

    afterAll(async () => {
      await cleanupFixture();
    });

    it.sequential('should generate a deeply nested module tree in the OS temp directory', async () => {
      const sourceModules = await glob('modules/**/value.ts', {
        cwd: path.join(fixture.fixtureDir, 'src'),
        onlyFiles: true,
      });

      expect(fixture.fixtureDir).toBe(path.join(os.tmpdir(), 'tsnv-tests', 'large'));
      expect(sourceModules).toHaveLength(LARGE_FIXTURE_MODULE_COUNT);
    });

    it.sequential('should build every module within the test timeout', async () => {
      const startedAt = performance.now();
      const build = await $({
        quiet: true,
        env: { ...process.env, DEBUG: '' },
      })`yarn tsnv`;
      buildDurationMs = performance.now() - startedAt;

      console.log(
        `[BENCHMARK] Built ${LARGE_FIXTURE_MODULE_COUNT} modules in ${Math.round(buildDurationMs)}ms`,
      );
      expect(build.exitCode, build.stdout + build.stderr).toBe(0);
      expect(stripAnsi(build.stdout)).toContain(
        `Collected files: ${LARGE_FIXTURE_MODULE_COUNT + 1}`,
      );
    });

    it.sequential('should emit every module, declaration, and the correct aggregate', async () => {
      const distDir = path.join(fixture.fixtureDir, 'dist');
      const [javascriptFiles, declarationFiles] = await Promise.all([
        glob('**/*.js', { cwd: distDir, onlyFiles: true }),
        glob('**/*.d.ts', { cwd: distDir, onlyFiles: true }),
      ]);

      expect(javascriptFiles).toHaveLength(LARGE_FIXTURE_MODULE_COUNT + 1);
      expect(declarationFiles).toHaveLength(LARGE_FIXTURE_MODULE_COUNT + 1);
      expect(javascriptFiles).toContain('modules/00/00/00/value.js');
      expect(javascriptFiles).toContain('modules/09/09/09/value.js');
      expect(declarationFiles).toContain('modules/00/00/00/value.d.ts');
      expect(declarationFiles).toContain('modules/09/09/09/value.d.ts');

      const indexDeclaration = await fs.promises.readFile(
        path.join(distDir, 'index.d.ts'),
        'utf-8',
      );
      expect(indexDeclaration).toContain('total');
      expect(indexDeclaration).toContain('number');

      const entryUrl = pathToFileURL(path.join(distDir, 'index.js'));
      const entry = await import(`${entryUrl.href}?${Date.now()}`);
      expect(entry.total).toBe(LARGE_FIXTURE_TOTAL);
      expect(buildDurationMs).toBeGreaterThan(0);
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
