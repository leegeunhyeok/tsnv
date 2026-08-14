import path from 'node:path';

import { interpreter } from 'rolldown/filter';
import { describe, expect, it } from 'vitest';

import type { PluginContext } from '../types';
import { resolveCodegenFilter } from './preserve-codegen-spec';

const cwd = path.resolve('/project');
const context = {
  cwd,
  source: path.join(cwd, 'src'),
  packageJson: {
    codegenConfig: {
      jsSrcsDir: 'src/native',
    },
  },
} as PluginContext;
const codegenSource = "export default codegenNativeComponent<NativeProps>('TestView');";

describe('resolveCodegenFilter', () => {
  it('matches native component specs inside jsSrcsDir', () => {
    const filter = resolveCodegenFilter(context)!;

    expect(
      interpreter(filter, codegenSource, path.join(cwd, 'src/native/TestViewNativeComponent.ts')),
    ).toBe(true);
  });

  it('ignores native component specs outside jsSrcsDir', () => {
    const filter = resolveCodegenFilter(context)!;

    expect(
      interpreter(filter, codegenSource, path.join(cwd, 'src/OutsideNativeComponent.ts')),
    ).toBe(false);
  });

  it('ignores files without a codegen call or naming convention', () => {
    const filter = resolveCodegenFilter(context)!;

    expect(
      interpreter(
        filter,
        'export default function TestViewNativeComponent() {}',
        path.join(cwd, 'src/native/TestViewNativeComponent.ts'),
      ),
    ).toBe(false);
    expect(
      interpreter(filter, codegenSource, path.join(cwd, 'src/native/NativeTestModule.ts')),
    ).toBe(false);
  });

  it('disables the filter without codegenConfig', () => {
    expect(resolveCodegenFilter({ ...context, packageJson: {} })).toBeUndefined();
  });
});
