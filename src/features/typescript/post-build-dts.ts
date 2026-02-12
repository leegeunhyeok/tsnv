import fs from 'node:fs/promises';
import path from 'node:path';

import { glob } from 'tinyglobby';

const dtsPatterns = ['**/*.d.ts'];

export async function postBuildDts(srcDir: string, outDir: string) {
  const userDts = await glob(dtsPatterns, { cwd: srcDir });

  for (const file of userDts) {
    const src = path.join(srcDir, file);
    const dest = path.join(outDir, file);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.copyFile(src, dest);
  }

  const generatedDts = await glob(dtsPatterns, { cwd: outDir });

  return generatedDts;
}
