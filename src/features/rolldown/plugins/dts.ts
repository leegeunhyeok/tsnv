import { createDebug } from 'obug';
import type * as rolldown from 'rolldown';
import { dts as dtsPlugin } from 'rolldown-plugin-dts';

import type { ResolvedConfig } from '../../../config/default';
import { removePlatformSpecificExtension } from '../../../utils/path';

const PLUGIN_NAME = 'tsnv:dts';
const debug = createDebug(PLUGIN_NAME);

export function dts(config: ResolvedConfig): rolldown.RolldownPluginOption {
  if (!config.dts) {
    return null;
  }

  const dtsExtension = ['d'];
  const dtsRenamer: rolldown.Plugin = {
    name: 'tsnv:dts-renamer',
    outputOptions(options) {
      return {
        ...options,
        entryFileNames(chunkInfo) {
          if (chunkInfo.name.endsWith('.d')) {
            const name = removePlatformSpecificExtension(
              chunkInfo.name,
              dtsExtension,
              config.specifiers,
            );
            const newChunkName = `${name}.ts`;
            debug(`renaming ${chunkInfo.name} to ${newChunkName}`);
            return newChunkName;
          } else {
            return chunkInfo.name;
          }
        },
      };
    },
  };

  return [
    dtsPlugin({
      emitDtsOnly: true,
      tsconfig: config.tsconfig,
      tsconfigRaw: config.tsconfigRaw,
      tsgo: config.experimental?.tsgo,
    }),
    dtsRenamer,
  ];
}
