import fs from 'node:fs';
import path from 'node:path';

import type { ChunkFileNamesFunction, RolldownPlugin } from 'rolldown';
import {
  and,
  code,
  id,
  include,
  prefixRegex,
  type TopLevelFilterExpression,
} from 'rolldown/filter';

import type { PluginContext } from '../types';

const CODEGEN_NATIVE_COMPONENT_PATTERN = /(?:^|\/)\w+NativeComponent\.[jt]sx?$/i;
const CODEGEN_NATIVE_COMPONENT_CALL_PATTERN = /\bcodegenNativeComponent</;

export interface CodegenPreservation {
  entryFileNames: ChunkFileNamesFunction;
  plugin: RolldownPlugin;
}

export function preserveCodegenSpec(
  context: PluginContext,
  defaultEntryFileNames: string,
): CodegenPreservation | undefined {
  const filter = resolveCodegenFilter(context);
  if (filter == null) {
    return;
  }

  const sources = new Map<string, string>();
  const staleOutputFiles = new Set<string>();

  return {
    entryFileNames(chunk) {
      return chunk.facadeModuleId != null && sources.has(chunk.facadeModuleId)
        ? '[name]'
        : defaultEntryFileNames;
    },
    plugin: {
      name: 'tsnv:preserve-codegen-spec',
      buildStart() {
        sources.clear();
        staleOutputFiles.clear();
      },
      transform: {
        order: 'pre',
        filter,
        handler(source, id) {
          sources.set(id, source);
        },
      },
      generateBundle(_outputOptions, bundle) {
        for (const [fileName, output] of Object.entries(bundle)) {
          if (output.type !== 'chunk' || output.facadeModuleId == null) {
            continue;
          }

          const source = sources.get(output.facadeModuleId);
          if (source == null) {
            continue;
          }

          const sourceFileName = toPosixPath(path.relative(context.source, output.facadeModuleId));
          const javascriptFileName = `${fileName}.js`;

          delete bundle[fileName];
          if (output.sourcemapFileName != null) {
            delete bundle[output.sourcemapFileName];
          }
          this.emitFile({
            type: 'asset',
            fileName: sourceFileName,
            originalFileName: output.facadeModuleId,
            source,
          });

          if (javascriptFileName !== sourceFileName) {
            staleOutputFiles.add(javascriptFileName);
          }
          staleOutputFiles.add(`${javascriptFileName}.map`);
        }
      },
      async writeBundle(outputOptions) {
        const outputDir = outputOptions.dir;
        if (outputDir == null) {
          return;
        }

        await Promise.all(
          Array.from(staleOutputFiles, (fileName) =>
            fs.promises.rm(path.resolve(outputDir, fileName), { force: true }),
          ),
        );
      },
    },
  };
}

export function resolveCodegenFilter(
  context: PluginContext,
): TopLevelFilterExpression[] | undefined {
  if (!('codegenConfig' in context.packageJson)) {
    return;
  }

  const codegenConfig = context.packageJson.codegenConfig;
  const codegenSource =
    typeof codegenConfig?.jsSrcsDir === 'string'
      ? path.resolve(context.cwd, codegenConfig.jsSrcsDir)
      : context.source;
  const sourcePrefix = `${toPosixPath(context.source)}/`;
  const codegenPrefix = `${toPosixPath(codegenSource)}/`;

  return [
    include(
      and(
        id(prefixRegex(sourcePrefix), { cleanUrl: true }),
        id(prefixRegex(codegenPrefix), { cleanUrl: true }),
        id(CODEGEN_NATIVE_COMPONENT_PATTERN, { cleanUrl: true }),
        code(CODEGEN_NATIVE_COMPONENT_CALL_PATTERN),
      ),
    ),
  ];
}

function toPosixPath(filepath: string) {
  return filepath.split(path.sep).join('/');
}
