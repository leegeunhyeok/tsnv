import { globSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, gzip } from 'node:zlib';

import type * as rolldown from 'rolldown';

import type { ResolvedConfig } from '../config/default';
import { isDts } from './path';

export const gzipAsync = promisify(gzip);
export const brotliCompressAsync = promisify(brotliCompress);

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

export interface SizeInfo {
  filename: string;
  dts: boolean;
  raw: number;
  rawText: string;
  gzip: number;
  gzipText: string;
}

export async function calcSize(
  // oxlint-disable-next-line typescript-eslint(no-redundant-type-constituents)
  chunk: rolldown.OutputAsset | rolldown.OutputChunk,
): Promise<SizeInfo> {
  const content = chunk.type === 'chunk' ? chunk.code : chunk.source;
  const raw = Buffer.byteLength(content, 'utf8');
  const gzip = (await gzipAsync(content)).length;

  return {
    filename: chunk.fileName,
    dts: chunk.fileName.endsWith('.d.ts'),
    raw,
    rawText: formatBytes(raw)!,
    gzip,
    gzipText: formatBytes(gzip),
  };
}

export function formatBytes(bytes: number) {
  return `${(bytes / 1000).toFixed(2)} kB`;
}
