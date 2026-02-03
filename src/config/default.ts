import type { Config } from './types';

export const DEFAULT_CONFIG = {
  source: 'src',
  outDir: 'dist',
  exclude: /__(?:tests?|fixtures?|mocks?)__/,
  specifiers: ['android', 'ios', 'native'],
  sourceExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  assetExtensions: [
    // Image formats
    'bmp',
    'gif',
    'jpg',
    'jpeg',
    'png',
    'psd',
    'svg',
    'webp',
    'xml',
    // Video formats
    'm4v',
    'mov',
    'mp4',
    'mpeg',
    'mpg',
    'webm',
    // Audio formats
    'aac',
    'aiff',
    'caf',
    'm4a',
    'mp3',
    'wav',
    // Document formats
    'html',
    'pdf',
    'yaml',
    'yml',
    // Font formats
    'otf',
    'ttf',
    // Archives (virtual files)
    'zip',
  ],
  assetsDir: '_assets',
  dts: true,
  clean: true,
} satisfies Config;

export type ResolvedConfig = Config & typeof DEFAULT_CONFIG;
