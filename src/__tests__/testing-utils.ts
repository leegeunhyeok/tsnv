import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { noop } from 'es-toolkit';
import { $ as zx$, type Shell } from 'zx';

export interface Fixture {
  $: Shell;
  fixtureDir: string;
}

export function log(...messages: any[]) {
  console.log('[TEST]', ...messages);
}

export function getFixtureBaseDir() {
  const tmpdir = os.tmpdir();
  return path.join(tmpdir, 'tsnv-tests');
}

export interface CreateFixtureOptions {
  installTsnv?: boolean;
  pnp?: boolean;
}

export async function createFixture(
  fixtureName: string,
  options?: CreateFixtureOptions,
): Promise<Fixture> {
  const { installTsnv = true, pnp = false } = options ?? {};

  log('Setting up fixture...');
  const fixtureBaseDir = getFixtureBaseDir();
  const fixtureDir = path.join(fixtureBaseDir, fixtureName);

  const $ = zx$({
    cwd: fixtureDir,
    nothrow: true,
    env: { ...process.env, DEBUG: 'tsnv:*' },
  });

  log(`Checking if fixture ${fixtureName} exists...`);
  const fixturePath = path.join(import.meta.dirname, '__fixtures__', fixtureName);
  await fs.promises.access(fixturePath, fs.constants.F_OK);

  const packagePath = path.join(process.cwd(), 'tsnv.tgz');
  log('Checking if package is packed...');
  await fs.promises.stat(packagePath);

  log('Generating fixture...');
  await fs.promises.mkdir(fixtureDir, { recursive: true });
  await fs.promises.cp(fixturePath, fixtureDir, {
    recursive: true,
  });

  log('Listing files...');
  await $({ stdio: 'inherit' })`find . -type f`;

  log('Setting up Yarn...');
  await $({ stdio: 'inherit' })`yarn set version stable`;
  await $({ stdio: 'inherit' })`yarn config set enableGlobalCache false`;
  await $({ stdio: 'inherit' })`yarn config set nodeLinker ${pnp ? 'pnp' : 'node-modules'}`;
  await $({ stdio: 'inherit' })`yarn --version`;

  log('Installing package...');
  if (installTsnv) {
    await $({ stdio: 'inherit' })`yarn add ${packagePath}`;
  } else {
    await $({ stdio: 'inherit' })`yarn install`;
  }

  return { $, fixtureDir };
}

export async function createFixtureApp(
  options?: Omit<CreateFixtureOptions, 'installTsnv'>,
): Promise<Fixture> {
  const appFixture = await createFixture('app', {
    ...options,
    installTsnv: false,
  });

  const reactNativeFixture = await createFixture('react-native', {
    installTsnv: false,
  });

  const packedFileName = 'package.tgz';
  const reactNativePackagePath = path.join(reactNativeFixture.fixtureDir, packedFileName);
  await reactNativeFixture.$`yarn pack --out ${packedFileName}`;
  await appFixture.$`yarn add react-native@${reactNativePackagePath}`;

  return appFixture;
}

export async function cleanupFixture() {
  log('Cleaning up fixture...');
  const fixtureBaseDir = getFixtureBaseDir();
  await fs.promises.rm(fixtureBaseDir, { recursive: true }).catch(noop);
  log('Fixture cleaned up');
}
