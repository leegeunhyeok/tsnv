import type { TsConfigJson } from 'get-tsconfig';
import type { OutputOptions } from 'rolldown';

export interface Config {
  /**
   * Defaults to `'src'`
   */
  source?: string;
  /**
   * The directory where output files will be written.
   *
   * Defaults to `'dist'`
   */
  outDir?: string;
  /**
   * Files to exclude from the build.
   *
   * Defaults to `/__(?:tests?|fixtures?|mocks?)__/`
   */
  exclude?: RegExp;
  /**
   * Specifiers to resolve platform specific modules.
   *
   * Defaults to `['android', 'ios', 'native']`
   */
  specifiers?: string[];
  /**
   * Source files extensions.
   *
   * Defaults to `['ts', 'tsx', 'js', 'jsx', 'json']`
   */
  sourceExtensions?: string[];
  /**
   * Asset files extensions.
   *
   * Default to following extensions: [Metro's default asset extensions](https://github.com/facebook/metro/blob/v0.83.3/packages/metro-config/src/defaults/defaults.js)
   */
  assetExtensions?: string[];
  /**
   * Enables generation of TypeScript declaration files (.d.ts).
   *
   * Defaults to `true`
   */
  dts?: boolean;
  /**
   * Generate source map files.
   */
  sourcemap?: OutputOptions['sourcemap'];
  /**
   * Code to prepend to the beginning of each output chunk.
   */
  banner?: OutputOptions['banner'];
  /**
   * Code to append to the end of each output chunk.
   */
  footer?: OutputOptions['footer'];
  /**
   * Code to prepend inside the wrapper function (after banner, before actual code).
   */
  intro?: OutputOptions['intro'];
  /**
   * Code to append inside the wrapper function (after actual code, before footer).
   */
  outro?: OutputOptions['outro'];
  /**
   * Clean output directory before build.
   *
   * Defaults to `true`
   */
  clean?: boolean;
  /**
   * The path to the tsconfig.json file.
   *
   * If set to `false`, the plugin will ignore any `tsconfig.json` file.
   * You can still specify `compilerOptions` directly in the options.
   *
   * Defaults to `'tsconfig.json'`
   */
  tsconfig?: string;
  /**
   * Pass a raw `tsconfig.json` object directly to the plugin.
   *
   * @see https://www.typescriptlang.org/tsconfig
   */
  tsconfigRaw?: Omit<TsConfigJson, 'compilerOptions'>;
  /**
   * Experimental configuration.
   */
  experimental?: ExperimentalConfig;
}

export interface ExperimentalConfig {
  /**
   * Whether to use the tsgo compiler.
   *
   * To use this option, make sure `@typescript/native-preview` is installed as a dependency.
   */
  tsgo?: boolean;
}
