import path from 'node:path';

import type * as rolldown from 'rolldown';

import type { Context, Format } from '../types';
import { getUniquePlatformSpecificFiles, resolveFilename } from '../utils/path';
import { dts } from './plugins/dts';
import { external } from './plugins/external';
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
    plugins: [external(pluginContext)],
    output: {
      banner: options.config.banner,
      footer: options.config.footer,
      intro: options.config.intro,
      outro: options.config.outro,
      sourcemap: options.config.sourcemap,
      preserveModulesRoot: options.config.source,
      preserveModules: true,
    },
  };

  let formats: Format[];
  if (Array.isArray(options.config.format)) {
    formats = options.config.format;
  } else {
    formats = [options.config.format];
  }

  const uniqueFormats = Array.from(new Set(formats));
  const isSingleFormat = uniqueFormats.length === 1;
  const filename = resolveFilename();

  const resolvedBuildOptions = uniqueFormats.map((format) => {
    return {
      ...baseOptions,
      output: {
        ...baseOptions.output,
        dir: isSingleFormat ? options.config.outDir : path.join(options.config.outDir, format),
        cleanDir: options.config.clean,
        format,
        entryFileNames: filename,
        chunkFileNames: filename,
      },
    } satisfies rolldown.BuildOptions;
  });

  if (options.config.dts) {
    resolvedBuildOptions.push({
      ...baseOptions,
      input: getUniquePlatformSpecificFiles(
        options.files,
        options.config.sourceExtensions,
        options.config.specifiers,
      ),
      plugins: [
        ...(Array.isArray(baseOptions.plugins) ? baseOptions.plugins : [baseOptions.plugins]),
        dts(options.config),
      ],
      output: {
        ...baseOptions.output,
        cleanDir: options.config.clean,
        dir: path.join(options.config.outDir, 'types'),
        format: 'esm',
        entryFileNames: filename,
        chunkFileNames: filename,
      },
    } satisfies rolldown.BuildOptions);
  }

  return resolvedBuildOptions;
}
