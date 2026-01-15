import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    entry: 'src/index.ts',
    format: 'esm',
    outDir: 'dist',
    dts: false,
    fixedExtension: false,
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
