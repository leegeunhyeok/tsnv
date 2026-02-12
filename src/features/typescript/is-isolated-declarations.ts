import path from 'node:path';

import { debug } from '../../common';

export async function isIsolatedDeclarations(tsconfigPath: string) {
  try {
    const ts = await import('typescript');
    const configFile = await ts.readConfigFile(tsconfigPath, ts.sys.readFile);
    const parsedConfig = ts.parseJsonConfigFileContent(
      configFile.config,
      ts.sys,
      path.dirname(tsconfigPath),
    );
    return Boolean(parsedConfig.options.isolatedDeclarations);
  } catch (error) {
    debug('isIsolatedDeclarations error', error);
    return false;
  }
}
