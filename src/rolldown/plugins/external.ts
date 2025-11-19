import path from 'node:path';
import { createDebug } from 'obug';
import type { RolldownPlugin } from 'rolldown';
import { hasPlatformSpecificModule } from '../../utils/path';
import type { PluginContext } from '../types';

const PLUGIN_NAME = 'tsnv:external';
const debug = createDebug(PLUGIN_NAME);

export function external(context: PluginContext): RolldownPlugin {
  const productionDependencies = Array.from(
    new Set([
      ...Object.keys(context.packageJson.dependencies ?? {}),
      ...Object.keys(context.packageJson.peerDependencies ?? {}),
    ]),
  );
  debug('production dependencies', productionDependencies);

  return {
    name: PLUGIN_NAME,
    async resolveId(id, importer, extraOptions) {
      if (extraOptions.isEntry || importer == null) {
        return;
      }

      const isProductionDependency = productionDependencies.some((packageName) =>
        isPackageImportSource(packageName, id),
      );
      if (isProductionDependency) {
        return { id, external: true };
      }

      const extname = path.extname(id);
      if (extname) {
        if (context.config.assetExtensions.includes(extname)) {
          return { id, external: true };
        }

        if (!context.config.sourceExtensions.includes(extname)) {
          throw new Error(`Unsupported file extension: ${extname}`);
        }
      }

      const resolved = await this.resolve(id, importer, extraOptions);
      if (resolved == null && (await hasPlatformSpecificModule(id, importer, context.config))) {
        return { id, external: true, moduleSideEffects: true };
      }

      return resolved;
    },
  };
}

function isPackageImportSource(packageName: string, id: string) {
  return id === packageName || id.startsWith(`${packageName}/`);
}
