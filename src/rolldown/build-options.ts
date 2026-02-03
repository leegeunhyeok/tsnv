import path from 'node:path';

import type * as rolldown from 'rolldown';

import type { Context } from '../types';
import { getUniquePlatformSpecificFiles, resolveFilename } from '../utils/path';
import { asset } from './plugins/asset';
import { blockRequire } from './plugins/block-require';
import { dts } from './plugins/dts';
import { external } from './plugins/external';
import { report } from './plugins/report';
import type { BuildOptions, PluginContext } from './types';

export function resolveBuildOptions(
  context: Context,
  options: BuildOptions,
): rolldown.BuildOptions[] {
  const pluginContext: PluginContext = {
    ...context,
    config: options.config,
  };

  const baseOptions: rolldown.BuildOptions = {
    input: options.files,
    transform: {
      jsx: 'react-jsx',
    },
    output: {
      banner: options.config.banner,
      footer: options.config.footer,
      intro: options.config.intro,
      outro: options.config.outro,
      sourcemap: options.config.sourcemap,
      preserveModulesRoot: options.config.source,
      cleanDir: options.config.clean,
      preserveModules: true,
      polyfillRequire: false,
    },
  };

  const filename = resolveFilename();
  const resolvedBuildOptions: rolldown.BuildOptions[] = [
    {
      ...baseOptions,
      plugins: [...getBasePlugins(pluginContext), report({ cwd: options.cwd, format: 'esm' })],
      output: {
        ...baseOptions.output,
        format: 'esm',
        dir: options.config.outDir,
        entryFileNames: filename,
        chunkFileNames: filename,
      },
    },
  ];

  if (options.config.dts) {
    resolvedBuildOptions.push({
      ...baseOptions,
      input: getUniquePlatformSpecificFiles(
        options.files,
        options.config.sourceExtensions,
        options.config.specifiers,
      ),
      plugins: [
        ...getBasePlugins(pluginContext),
        report({ cwd: options.cwd, format: 'dts' }),
        dts(options.config),
      ],
      output: {
        ...baseOptions.output,
        cleanDir: false,
        dir: options.config.outDir,
        format: 'esm',
        entryFileNames: filename,
        chunkFileNames: filename,
      },
    } satisfies rolldown.BuildOptions);
  }

  return resolvedBuildOptions;
}

function getBasePlugins(pluginContext: PluginContext) {
  return [blockRequire(), asset(pluginContext), external(pluginContext)];
}
