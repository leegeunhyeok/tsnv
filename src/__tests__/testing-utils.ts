import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { noop } from 'es-toolkit';
import { $ } from 'zx';

export interface Fixture {
  fixtureDir: string;
  cleanup: () => Promise<void>;
}

export function log(...messages: any[]) {
  console.log('[TEST]', ...messages);
}

export interface CreateFixtureOptions {
  pnp?: boolean;
}

export async function createFixture(fixtureName: string, options?: CreateFixtureOptions): Promise<Fixture> {
  log('Setting up fixture...');
  const tmpdir = os.tmpdir();
  const fixtureDir = path.join(tmpdir, 'tsnv-tests');

  async function cleanup() {
    log('Cleaning up fixture...');
    await fs.promises.rm(fixtureDir, { recursive: true }).catch(noop);
    log('Fixture cleaned up');
  }

  $.cwd = fixtureDir;
  $.env = { ...process.env, DEBUG: 'tsnv:*' };

  log(`Checking if fixture ${fixtureName} exists...`);
  const fixturePath = path.join(import.meta.dirname, '__fixtures__', fixtureName);
  await fs.promises.access(fixturePath, fs.constants.F_OK);

  const packagePath = path.join(process.cwd(), 'tsnv.tgz');
  await cleanup();

  log('Checking if package is packed...');
  await fs.promises.stat(packagePath);

  log('Creating fixture directory...');
  await fs.promises.mkdir(fixtureDir, { recursive: true });
  await fs.promises.cp(fixturePath, fixtureDir, {
    recursive: true,
  });

  log('Listing files...');
  await $({ stdio: 'inherit' })`find . -type f`;

  log('Setting up Yarn...');
  await $({ stdio: 'inherit' })`yarn set version stable`;
  await $({ stdio: 'inherit' })`yarn config set enableGlobalCache false`;
  await $({ stdio: 'inherit' })`yarn config set nodeLinker ${options?.pnp ? 'pnp' : 'node-modules'}`;
  await $({ stdio: 'inherit' })`yarn --version`;

  log('Installing package...');
  await $({ stdio: 'inherit' })`yarn add ${packagePath}`;

  return { fixtureDir, cleanup };
}
