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

  const typescriptVersion = options.tsgo ? await getInstalledTypeScriptVersion() : undefined;
  const compiler = resolveDeclarationCompiler(options.tsgo, typescriptVersion);

  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      packageManager.name,
      withExecuteArguments(packageManager.name, [
        compiler,
        '--declaration',
        '--emitDeclarationOnly',
        '--noEmit',
        'false',
        '--project',
        options.tsconfigPath,
        '--outDir',
        options.outDir,
      ]),
      { cwd: options.cwd },
    );

    let stdErr = '';
    let stdOut = '';

    child.stdout.on('data', (data) => (stdOut += data));
    child.stderr.on('data', (data) => (stdErr += data));

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        const stdout = stdOut + stdErr;
        reject(new Error(`${compiler} exited with code ${code}` + (stdout ? `\n\n${stdout}` : '')));
      }
    });

    child.on('error', reject);
  });
}

export function resolveDeclarationCompiler(
  useTsgo: boolean | undefined,
  typescriptVersion: string | undefined,
) {
  const majorVersion = Number.parseInt(typescriptVersion?.split('.')[0] ?? '', 10);
  return useTsgo && !(majorVersion >= 7) ? 'tsgo' : 'tsc';
}

async function getInstalledTypeScriptVersion() {
  try {
    return (await import('typescript')).versionMajorMinor;
  } catch {
    return undefined;
  }
}

function withExecuteArguments(packageManagerType: string, args: string[]) {
  switch (packageManagerType) {
    case 'npm':
      return ['exec', ...args];

    default:
      return [...args];
  }
}
