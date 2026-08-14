import path from 'node:path';

import { debug } from '../../common';

interface LegacyTypeScript {
  readConfigFile(path: string, readFile: (path: string) => string | undefined): { config: unknown };
  parseJsonConfigFileContent(
    config: unknown,
    host: unknown,
    basePath: string,
  ): { options: { isolatedDeclarations?: boolean } };
  sys: {
    readFile(path: string): string | undefined;
  };
}

export async function isIsolatedDeclarations(tsconfigPath: string) {
  try {
    const ts = await import('typescript');

    if (Number(ts.versionMajorMinor.split('.')[0]) >= 7) {
      const { API } = await import('typescript/unstable/sync');
      const api = new API({ cwd: path.dirname(tsconfigPath) });
      try {
        return Boolean(api.parseConfigFile(tsconfigPath).options.isolatedDeclarations);
      } finally {
        api.close();
      }
    }

    const legacyTs = ts as unknown as LegacyTypeScript;
    const configFile = legacyTs.readConfigFile(tsconfigPath, (filePath) =>
      legacyTs.sys.readFile(filePath),
    );
    const parsedConfig = legacyTs.parseJsonConfigFileContent(
      configFile.config,
      legacyTs.sys,
      path.dirname(tsconfigPath),
    );
    return Boolean(parsedConfig.options.isolatedDeclarations);
  } catch (error) {
    debug('isIsolatedDeclarations error', error);
    return false;
  }
}
