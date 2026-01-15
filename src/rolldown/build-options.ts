import type * as rolldown from 'rolldown';

import type { Context, Format } from '../types';
import { resolveFilename } from '../utils/path';
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

  const shouldClean = options.config.clean;
  const baseOptions: rolldown.BuildOptions = {
    input: options.files,
    plugins: [external(pluginContext)],
    output: {
      dir: options.config.outDir,
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
  if (!Array.isArray(options.config.format)) {
    formats = [options.config.format];
  } else {
    formats = options.config.format;
  }

  return formats.map((format, index) => {
    const filename = resolveFilename(context.packageType, format);

    return {
      ...baseOptions,
      output: {
        ...baseOptions.output,
        cleanDir: index === 0 ? shouldClean : false,
        format,
        entryFileNames: filename,
        chunkFileNames: filename,
      },
    };
  });
}
