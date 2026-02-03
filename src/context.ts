import fs from 'node:fs';

import * as pkg from 'empathic/package';
import { assert } from 'es-toolkit';

import type { Context } from './types';

export async function resolveContext(cwd: string): Promise<Context> {
  const packageJsonPath = pkg.up({ cwd });
  assert(packageJsonPath, 'could not find package.json');

  const rawPackageJson = await fs.promises.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(rawPackageJson);

  return { cwd, packageJson };
}
