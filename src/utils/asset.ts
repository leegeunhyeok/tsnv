import fs from 'node:fs';
import path from 'node:path';

import pc from 'picocolors';

import type { PluginContext } from '../features/rolldown/types';
import type { Context } from '../types';

// key: asset path, value: virtual file path
const assets = new Map<string, string>();

export function addAsset(key: string, value: string) {
  assets.set(key, value);
}

export function flushAssets(context: Context) {
  let count = 0;
  const label = pc.yellow('[AST]');
  for (const [key, value] of assets.entries()) {
    const destination = path.join(context.outdir, value);
    const dirname = path.dirname(destination);
    const filename = path.basename(destination);
    if (!fs.existsSync(dirname)) {
      fs.mkdirSync(dirname, { recursive: true });
    }

    fs.copyFileSync(key, destination);
    console.log(
      label,
      pc.dim(path.relative(context.cwd, dirname) + path.sep) + pc.yellow(filename),
    );
    count++;
  }
  console.log(label, `${count} files`);
  assets.clear();
}

const SCALE_PATTERN = '@(\\d+\\.?\\d*)x';

export function collectAssets(context: PluginContext, assetPath: string) {
  const dirname = path.dirname(assetPath);
  const extension = path.extname(assetPath);
  const basename = path.basename(assetPath, extension);
  const baseName = stripAllSuffixes(context, basename);

  const platformPattern = context.config.specifiers.map((p) => `\\.${p}`).join('|');
  const assetRegExp = new RegExp(
    `^${escapeRegExp(baseName)}(${SCALE_PATTERN})?(${platformPattern})?${escapeRegExp(extension)}$`,
  );

  const files = fs.readdirSync(dirname, { withFileTypes: true });
  const matchedFiles: string[] = [];

  for (const file of files) {
    if (file.isFile() && assetRegExp.test(file.name)) {
      matchedFiles.push(path.join(dirname, file.name));
    }
  }

  return {
    baseName,
    extension,
    files: matchedFiles,
  };
}

function stripAllSuffixes(context: PluginContext, basename: string): string {
  const platformPattern = context.config.specifiers.map((p) => `\\.${p}`).join('|');
  return basename.replace(new RegExp(`(${SCALE_PATTERN})?(${platformPattern})?$`), '');
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
