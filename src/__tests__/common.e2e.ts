import fs from 'node:fs';
import path from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Shell } from 'zx';

import { createFixture, createFixtureApp, cleanupFixture, type Fixture } from './testing-utils';

const PACKED_PACKAGE_PATH = 'package.tgz';

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
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');

      // Types
      expect(stdout).toContain('greeting.d.ts');
      expect(stdout).toContain('index.d.ts');
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

      // Check TypeScript compilation
      const { exitCode: tscExitCode } = await app.$({ nothrow: true })`yarn tsc --noEmit`;
      expect(tscExitCode).toBe(0);

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
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');

      // Types
      expect(stdout).toContain('greeting.d.ts');
      expect(stdout).toContain('index.d.ts');
    });
  });
});
