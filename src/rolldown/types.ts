import type { ResolvedConfig } from '../config/default';
import type { Context } from '../types';

export interface BuildOptions {
  files: string[];
  config: ResolvedConfig;
}

export interface PluginContext extends Context {
  config: ResolvedConfig;
}
