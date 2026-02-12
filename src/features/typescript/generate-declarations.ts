import { spawn } from 'node:child_process';

import { assert } from 'es-toolkit';
import { detect } from 'package-manager-detector';

import { debug } from '../../common';

export interface GenerateDeclarationsOptions {
  cwd: string;
  outDir: string;
  tsconfigPath: string;
  tsgo?: boolean;
}

export async function generateDeclarations(options: GenerateDeclarationsOptions) {
  const packageManager = await detect({ cwd: options.cwd });
  assert(packageManager, 'Failed to get package manager');
  debug('Detected package manager', packageManager);

  return new Promise<void>((resolve, reject) => {
    const tscBin = options.tsgo ? 'tsgo' : 'tsc';
    const child = spawn(
      packageManager.name,
      withExecuteArguments(packageManager.name, [
        tscBin,
        '--declaration',
        '--emitDeclarationOnly',
        '--noEmit',
        'false',
        '--project',
        options.tsconfigPath,
        '--outDir',
        options.outDir,
      ]),
    );

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${tscBin} exited with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

function withExecuteArguments(packageManagerType: string, args: string[]) {
  switch (packageManagerType) {
    case 'npm':
      return ['exec', ...args];

    default:
      return [...args];
  }
}
