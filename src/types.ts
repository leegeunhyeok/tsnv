export interface Context {
  cwd: string;
  outdir: string;
  source: string;
  packageJson: any; // TODO
}

export type Format = 'esm';
