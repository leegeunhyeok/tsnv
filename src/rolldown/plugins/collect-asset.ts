import path from 'node:path';

import { assert } from 'es-toolkit';
import type { RolldownPlugin } from 'rolldown';

import { collectAssets } from '../../utils/asset';
import { addAsset } from '../../utils/asset';
import { toRelativePath } from '../../utils/path';
import type { PluginContext } from '../types';

export function collectAsset(context: PluginContext): RolldownPlugin {
  return {
    name: 'tsnv:collect-asset',
    resolveId(id, importer) {
      const extname = path.extname(id).slice(1);

      if (extname) {
        if (context.config.assetExtensions.includes(extname)) {
          const resolveDir = importer ? path.dirname(importer) : context.cwd;
          const assetPath = path.resolve(resolveDir, id);
          const collectedAssets = collectAssets(context, assetPath);
          this.debug(`Found asset: ${id} (at: ${importer ?? '<unknown>'})`);

          let virtualDir = '';
          for (const file of collectedAssets.files) {
            const virtualPath = resolveVirtualAssetPath(context, file);
            if (!virtualDir) {
              virtualDir = path.dirname(virtualPath);
            }
            addAsset(file, virtualPath);
          }

          if (collectedAssets.files.length === 0) {
            this.warn(`No assets found for ${id}`);
            return { id, external: true };
          } else {
            assert(virtualDir, 'virtual asset directory not found');
            const basename = path.basename(assetPath);
            const sourceRelativePath = path.relative(resolveDir, context.source);
            const virtualAssetPath = path.join(sourceRelativePath, virtualDir, basename);
            return {
              id: toRelativePath(virtualAssetPath),
              external: true,
            };
          }
        }
      }
    },
  };
}

function resolveVirtualAssetPath(context: PluginContext, asset: string) {
  const assetRelativePath = path.relative(context.cwd, asset);
  return path.join(context.config.assetsDir, assetRelativePath);
}
