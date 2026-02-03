import fs from 'node:fs';
import path from 'node:path';

import * as pkg from 'empathic/package';
import { assert } from 'es-toolkit';

import type { ResolvedConfig } from './config/default';
import type { Context } from './types';

export async function resolveContext(cwd: string, config: ResolvedConfig): Promise<Context> {
  const packageJsonPath = pkg.up({ cwd });
  assert(packageJsonPath, 'could not find package.json');

  const rawPackageJson = await fs.promises.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(rawPackageJson);

  return {
    cwd,
    packageJson,
    outdir: path.resolve(cwd, config.outDir),
    source: path.resolve(cwd, config.source),
  };
}
