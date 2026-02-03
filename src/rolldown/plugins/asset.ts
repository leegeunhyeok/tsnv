import path from 'node:path';

import type { RolldownPlugin } from 'rolldown';

import type { PluginContext } from '../types';

export function asset(context: PluginContext): RolldownPlugin {
  return {
    name: 'tsnv:asset',
    async resolveId(id, importer) {
      const extname = path.extname(id).slice(1);

      if (extname) {
        if (context.config.assetExtensions.includes(extname)) {
          const resolved = await this.resolve(id, importer);
          this.debug(
            `Found asset: ${id} (from importer: ${importer ?? 'none'}) -> ${resolved?.id}`,
          );

          return { id, external: true };
        }
      }
    },
  };
}
