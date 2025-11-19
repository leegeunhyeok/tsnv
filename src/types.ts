export interface Context {
  cwd: string;
  packageJson: any; // TODO
  packageType: Format;
}

export type Format = 'esm' | 'cjs';
