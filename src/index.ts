import path from 'path';

import { loadConfig } from 'c12';
import pc from 'picocolors';
import { VERSION as rolldownVersion } from 'rolldown';

import { debug } from './common';
import type { ResolvedConfig } from './config/default';
import { DEFAULT_CONFIG } from './config/default';
import { resolveContext } from './context';
import { build } from './features/rolldown';
import { generateDeclarations } from './features/typescript/generate-declarations';
import { postBuildDts } from './features/typescript/post-build-dts';
import { flushAssets } from './utils/asset';
import { formatTime } from './utils/format';
import { collectFiles } from './utils/fs';
import { DTS_LABEL, withBoundary } from './utils/log';
import { getBindingErrors } from './utils/rolldown';

declare const __VERSION__: string;
const version = `v${__VERSION__}`;

async function main() {
  console.log(`tsnv ${pc.dim(version)} powered by rolldown ${pc.dim(rolldownVersion)}`);

  debug('Loading config...');

  const cwd = process.cwd();
  const { config, configFile } = await loadConfig<ResolvedConfig>({
    cwd,
    configFile: 'tsnv.config',
    defaultConfig: DEFAULT_CONFIG,
  });

  debug('Config loaded', config);
  console.log(`Config File: ${pc.underline(configFile)}`);
  console.log(`Source Path: ${pc.blue(path.resolve(config.source))}`);

  const context = await resolveContext(cwd, config);
  debug('Resolved context', context);

  const files = await collectFiles(config);
  console.log(`Collected files: ${pc.dim(files.length)}`);

  console.log('Build start');
  const buildStartedAt = performance.now();
  await build(context, { cwd, files, config });
  const buildEndedAt = performance.now();

  const postBuildStartedAt = performance.now();
  if (context.typescript.isolatedDeclarations === false) {
    debug('Generate type declarations');
    console.log(DTS_LABEL, 'Generating type declarations...');
    await generateDeclarations({
      cwd,
      outDir: path.resolve(cwd, config.outDir),
      tsconfigPath: path.resolve(cwd, config.tsconfig),
      tsgo: config.experimental?.tsgo,
    });
    const generatedDts = await postBuildDts(
      path.resolve(cwd, config.source),
      path.resolve(cwd, config.outDir),
    );
    console.log(DTS_LABEL, `${generatedDts.length} files`);
  }

  flushAssets(context);
  const postBuildEndedAt = performance.now();

  const buildDuration = buildEndedAt - buildStartedAt;
  const postBuildDuration = postBuildEndedAt - postBuildStartedAt;

  console.log(`Done in ${pc.green(formatTime(buildDuration + postBuildDuration))}`);
  console.log(pc.gray(`├─ build: ${formatTime(buildDuration)}`));
  console.log(pc.gray(`└─ post: ${formatTime(postBuildDuration)}`));
}

await main().catch((reason) => {
  const errors = getBindingErrors(reason) ?? ([reason] as Error[]);
  console.error(''); // empty line
  errors.forEach((error, index) => {
    console.error(withBoundary(pc.red(`Error #${index + 1}`), error.message) + '\n');
  });
  console.error(pc.red(`Build failed with ${errors.length} error${errors.length > 1 ? 's' : ''}`));
  process.exit(1);
});
