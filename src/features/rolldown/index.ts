import { createDebug } from 'obug';
import { build as rolldownBuild } from 'rolldown';

import type { Context } from '../../types';
import { resolveBuildOptions } from './build-options';
import type { BuildOptions } from './types';

const debug = createDebug('tsnv:build');

export async function build(context: Context, options: BuildOptions) {
  const buildOptions = resolveBuildOptions(context, options);
  debug('Resolved build options', buildOptions);

  for (const buildOption of buildOptions) {
    await rolldownBuild(buildOption);
  }
}
