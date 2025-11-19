import { loadConfig } from 'c12';
import { debug } from './common';
import type { ResolvedConfig } from './config/default';
import { DEFAULT_CONFIG } from './config/default';
import { resolveContext } from './context';
import { build } from './rolldown';
import { collectFiles } from './utils/fs';

debug('Loading config...');
const { config } = await loadConfig<ResolvedConfig>({
  configFile: 'tsnv.config',
  defaultConfig: DEFAULT_CONFIG,
});

debug('Config loaded', config);

const context = await resolveContext(process.cwd());
debug('Resolved context', context);

const files = await collectFiles(config);
debug('Collected files', files);

await build(context, { files, config });
