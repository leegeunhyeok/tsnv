import path from 'node:path';

import pc from 'picocolors';
import type { RolldownPlugin } from 'rolldown';

import { Format } from '../../types';
import { calcSize, formatBytes, type SizeInfo } from '../../utils/fs';

export interface ReportOptions {
  cwd: string;
  format: Format | 'dts';
}

const noop = (text: string) => text;

export function report(options: ReportOptions): RolldownPlugin {
  const { cwd, format } = options;
  const formatLabel = (() => {
    switch (format) {
      case 'esm':
        return pc.blue(`[ESM]`);
      case 'dts':
        return pc.green(`[DTS]`);
    }
  })();

  return {
    name: 'tsnv:report',
    async writeBundle(outputOptions, bundle) {
      const outDir = path.relative(
        cwd,
        outputOptions.dir ? path.resolve(outputOptions.dir) : path.dirname(outputOptions.file!),
      );

      const sizes: SizeInfo[] = [];
      for (const chunk of Object.values(bundle)) {
        const size = await calcSize(chunk);
        sizes.push(size);
      }

      let totalRaw = 0;
      for (const size of sizes) {
        totalRaw += size.raw;
      }

      for (const size of sizes) {
        const filenameColor = size.dts ? pc.green : noop;
        const filename = path.normalize(size.filename);
        console.log(
          formatLabel,
          pc.dim(outDir + path.sep) + filenameColor(filename),
          pc.dim(size.rawText),
          pc.dim(`(gzip ${size.gzipText})`),
        );
      }

      console.log(formatLabel, `${sizes.length} files, total: ${formatBytes(totalRaw)}`);
    },
  };
}
