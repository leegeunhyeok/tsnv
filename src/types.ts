export interface Context {
  cwd: string;
  outdir: string;
  source: string;
  packageJson: any; // TODO
  typescript: {
    isolatedDeclarations: boolean;
  };
}

export type Format = 'esm';
