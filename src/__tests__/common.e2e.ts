import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { $ } from 'zx';

import { createFixture, type Fixture } from './testing-utils';

describe('tsnv', () => {
  describe('CommonJS', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await createFixture('cjs');
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $({ nothrow: true })`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $({ nothrow: true })`ls -R dist`;
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');
    });
  });

  describe('ESModule', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await createFixture('esm');
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $({ nothrow: true })`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $({ nothrow: true })`ls -R dist`;
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');
    });
  });

  describe('Dual', () => {
    let fixture: Fixture;

    beforeAll(async () => {
      fixture = await createFixture('dual');
    });

    afterAll(async () => {
      await fixture.cleanup();
    });

    it.sequential('should build a package', async () => {
      const { exitCode } = await $({ nothrow: true })`yarn tsnv`;
      expect(exitCode).toBe(0);
    });

    it.sequential('should contain generated files', async () => {
      const { stdout } = await $({ nothrow: true })`ls -R dist`;

      // CommonJS
      expect(stdout).toContain('greeting.android.js');
      expect(stdout).toContain('greeting.ios.js');
      expect(stdout).toContain('index.js');

      // ESM
      expect(stdout).toContain('greeting.android.mjs');
      expect(stdout).toContain('greeting.ios.mjs');
      expect(stdout).toContain('index.mjs');
    });
  });
});
