import { defineConfig } from 'tsnv';

export default defineConfig({
  source: 'src',
  outDir: 'dist',
  experimental: {
    tsgo: true,
  },
});
