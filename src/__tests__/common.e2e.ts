import fs from 'node:fs';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Shell } from 'zx';

import { createFixture, createFixtureApp, cleanupFixture, type Fixture } from './testing-utils';

const PACKED_PACKAGE_PATH = 'package.tgz';

describe('tsnv', () => {
  describe.sequential('CommonJS', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('cjs');
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
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');

      // Types
      expect(stdout).toContain('types/greeting.d.ts');
      expect(stdout).toContain('types/index.d.ts');
    });

    it.sequential('should build a package and run it by platform', async () => {
      const app = await createFixtureApp();
      const entryFilePath = path.join(app.fixtureDir, 'src', 'index.ts');
      const packageFilePath = path.join(fixture.fixtureDir, PACKED_PACKAGE_PATH);
      const packageName = JSON.parse(
        await fs.promises.readFile(path.join(fixture.fixtureDir, 'package.json'), 'utf-8'),
      ).name;
      await app.$({ stdio: 'inherit' })`yarn add ${packageName}@${packageFilePath}`;

      await fs.promises.writeFile(entryFilePath, `require('${packageName}').greeting();`);

      const { exitCode: androidExitCode } = await app.$`yarn build:android`;
      const { exitCode: iosExitCode } = await app.$`yarn build:ios`;
      expect(androidExitCode).toBe(0);
      expect(iosExitCode).toBe(0);

      const { stdout: androidStdout } = await app.$`node dist/bundle.android.js`;
      expect(androidStdout).toContain('Hello, Android!');
      const { stdout: iosStdout } = await app.$`node dist/bundle.ios.js`;
      expect(iosStdout).toContain('Hello, iOS!');
    });
  });

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
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');

      // Types
      expect(stdout).toContain('types/greeting.d.ts');
      expect(stdout).toContain('types/index.d.ts');
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
        `import { greeting } from '${packageName}';` + `greeting();`,
      );

      const { exitCode: androidExitCode } = await app.$`yarn build:android`;
      const { exitCode: iosExitCode } = await app.$`yarn build:ios`;
      expect(androidExitCode).toBe(0);
      expect(iosExitCode).toBe(0);

      const { stdout: androidStdout } = await app.$`node dist/bundle.android.js`;
      expect(androidStdout).toContain('Hello, Android!');
      const { stdout: iosStdout } = await app.$`node dist/bundle.ios.js`;
      expect(iosStdout).toContain('Hello, iOS!');
    });
  });

  describe.sequential('Dual', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('dual');
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

      // CommonJS
      expect(stdout).toContain('cjs/greeting.android.js');
      expect(stdout).toContain('cjs/greeting.ios.js');
      expect(stdout).toContain('cjs/index.js');

      // ESM
      expect(stdout).toContain('esm/greeting.android.js');
      expect(stdout).toContain('esm/greeting.ios.js');
      expect(stdout).toContain('esm/index.js');

      // Types
      expect(stdout).toContain('types/greeting.d.ts');
      expect(stdout).toContain('types/index.d.ts');
    });

    it.sequential('should build a package and run it by platform (CommonJS/ESModule)', async () => {
      const app = await createFixtureApp();
      const entryFilePath = path.join(app.fixtureDir, 'src', 'index.ts');
      const packageFilePath = path.join(fixture.fixtureDir, PACKED_PACKAGE_PATH);
      const packageName = JSON.parse(
        await fs.promises.readFile(path.join(fixture.fixtureDir, 'package.json'), 'utf-8'),
      ).name;
      await app.$({ stdio: 'inherit' })`yarn add ${packageName}@${packageFilePath}`;

      // CommonJS
      await fs.promises.writeFile(entryFilePath, `require('${packageName}').greeting();`);

      const { exitCode: androidExitCodeCjs } = await app.$({
        env: { ...process.env, CJS_ONLY: '1' },
      })`yarn build:android`;
      const { exitCode: iosExitCodeCjs } = await app.$({
        env: { ...process.env, CJS_ONLY: '1' },
      })`yarn build:ios`;
      expect(androidExitCodeCjs).toBe(0);
      expect(iosExitCodeCjs).toBe(0);

      const { stdout: androidStdoutCjs } = await app.$`node dist/bundle.android.js`;
      expect(androidStdoutCjs).toContain('Hello, Android!');
      const { stdout: iosStdoutCjs } = await app.$`node dist/bundle.ios.js`;
      expect(iosStdoutCjs).toContain('Hello, iOS!');

      const androidBundleCjs = await fs.promises.readFile(
        path.join(app.fixtureDir, 'dist', 'bundle.android.js'),
        'utf-8',
      );
      const iosBundleCjs = await fs.promises.readFile(
        path.join(app.fixtureDir, 'dist', 'bundle.ios.js'),
        'utf-8',
      );
      expect(androidBundleCjs).toContain('cjs/greeting.android.js');
      expect(iosBundleCjs).toContain('cjs/greeting.ios.js');

      // ESModule
      await fs.promises.writeFile(
        entryFilePath,
        `import { greeting } from '${packageName}';` + `greeting();`,
      );

      const { exitCode: androidExitCodeEsm } = await app.$({
        env: { ...process.env, ESM_ONLY: '1' },
      })`yarn build:android`;
      const { exitCode: iosExitCodeEsm } = await app.$({
        env: { ...process.env, ESM_ONLY: '1' },
      })`yarn build:ios`;
      expect(androidExitCodeEsm).toBe(0);
      expect(iosExitCodeEsm).toBe(0);

      const { stdout: androidStdoutEsm } = await app.$`node dist/bundle.android.js`;
      expect(androidStdoutEsm).toContain('Hello, Android!');
      const { stdout: iosStdoutEsm } = await app.$`node dist/bundle.ios.js`;
      expect(iosStdoutEsm).toContain('Hello, iOS!');

      const androidBundleEsm = await fs.promises.readFile(
        path.join(app.fixtureDir, 'dist', 'bundle.android.js'),
        'utf-8',
      );
      const iosBundleEsm = await fs.promises.readFile(
        path.join(app.fixtureDir, 'dist', 'bundle.ios.js'),
        'utf-8',
      );
      expect(androidBundleEsm).toContain('esm/greeting.android.js');
      expect(iosBundleEsm).toContain('esm/greeting.ios.js');
    });
  });

  describe.sequential('Yarn PnP', () => {
    let fixture: Fixture;
    let $: Shell;

    beforeAll(async () => {
      await cleanupFixture();
      fixture = await createFixture('dual', { pnp: true });
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

      // CommonJS
      expect(stdout).toContain('cjs/greeting.android.js');
      expect(stdout).toContain('cjs/greeting.ios.js');
      expect(stdout).toContain('cjs/index.js');

      // ESM
      expect(stdout).toContain('esm/greeting.android.js');
      expect(stdout).toContain('esm/greeting.ios.js');
      expect(stdout).toContain('esm/index.js');

      // Types
      expect(stdout).toContain('types/greeting.d.ts');
      expect(stdout).toContain('types/index.d.ts');
    });
  });
});
