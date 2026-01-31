import fs from 'node:fs';

import { defineConfig } from 'tsdown';

const pkg = fs.readFileSync('package.json', 'utf-8');
const version = JSON.parse(pkg).version;

export default defineConfig([
  {
    entry: 'src/index.ts',
    format: 'esm',
    outDir: 'dist',
    dts: false,
    fixedExtension: false,
    define: {
      __VERSION__: JSON.stringify(version),
    },
  },
  {
    entry: 'src/config.ts',
    format: ['esm', 'cjs'],
    outDir: 'dist',
    dts: true,
    fixedExtension: false,
    checks: {
      legacyCjs: false,
    },
  },
]);
