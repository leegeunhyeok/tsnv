import fs from 'node:fs';
import path from 'node:path';

import type { ResolvedConfig } from '../config/default';

export async function hasPlatformSpecificModule(
  id: string,
  importer: string,
  config: ResolvedConfig,
) {
  const specifiers = config.specifiers;
  const resolveDir = path.dirname(importer);

  let fileList = hasPlatformSpecificModule.cache.get(resolveDir);
  if (fileList == null) {
    const entries = await fs.promises.readdir(resolveDir, {
      recursive: false,
      withFileTypes: true,
    });
    fileList = entries
      .filter((file) => file.isFile())
      .map(({ name }) => basenameWithoutExtension(name));
    hasPlatformSpecificModule.cache.set(resolveDir, fileList);
  }

  return specifiers.some((specifier) =>
    fileList.includes(`${basenameWithoutExtension(id)}.${specifier}`),
  );
}

function basenameWithoutExtension(id: string) {
  return path.basename(id, path.extname(id));
}

hasPlatformSpecificModule.cache = new Map<string, string[]>();

/**
 * For React Native modules, the standard module specification cannot be followed.
 *
 * In the case of platform-specific modules, a prefix such as `android.js` or `ios.js` is added before the module name.
 * If the standard module specification, which requires the full file path to be specified, is followed, platform-specific modules cannot be found.
 *
 * Therefore, the `.js` extension is used regardless of whether the module is ESM or CJS.
 */
export function resolveFilename() {
  return `[name].js`;
}

export function isDts(filename: string) {
  return filename.endsWith('.d.ts');
}
