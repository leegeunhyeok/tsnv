import { globSync } from 'node:fs';
import path from 'node:path';
import type { ResolvedConfig } from '../config/default';
import { isDts } from './path';

export function collectFiles(config: ResolvedConfig) {
  const globPattern = `**/*.{${config.sourceExtensions.join(',')}}`;
  const files = globSync(globPattern, {
    cwd: config.source,
    exclude: (filename) => config.exclude.test(filename) || isDts(filename),
  });

  if (files.length === 0) {
    throw new Error(`No files found in ${path.resolve(config.source)}`);
  }

  return files.map((file) => path.join(config.source, file));
}
