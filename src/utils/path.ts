import fs from 'node:fs';
import path from 'node:path';
import type { ResolvedConfig } from '../config/default';
import type { Format } from '../types';

export async function hasPlatformSpecificModule(id: string, importer: string, config: ResolvedConfig) {
  const specifiers = config.specifiers;
  const resolveDir = path.dirname(importer);

  let fileList = hasPlatformSpecificModule.cache.get(resolveDir);
  if (fileList == null) {
    const entries = await fs.promises.readdir(resolveDir, { recursive: false, withFileTypes: true });
    fileList = entries.filter((file) => file.isFile()).map(({ name }) => basenameWithoutExtension(name));
    hasPlatformSpecificModule.cache.set(resolveDir, fileList);
  }

  return specifiers.some((specifier) => fileList.includes(`${basenameWithoutExtension(id)}.${specifier}`));
}

function basenameWithoutExtension(id: string) {
  return path.basename(id, path.extname(id));
}

hasPlatformSpecificModule.cache = new Map<string, string[]>();

export function resolveFilename(packageType: Format, format: Format) {
  let extension: string;

  if (packageType === format) {
    extension = '.js';
  } else {
    extension = format === 'esm' ? '.mjs' : '.cjs';
  }

  return `[name]${extension}`;
}

export function isDts(filename: string) {
  return filename.endsWith('.d.ts');
}
