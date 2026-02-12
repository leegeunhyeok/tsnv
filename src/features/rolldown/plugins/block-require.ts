import { RolldownPlugin } from 'rolldown';

export function blockRequire(): RolldownPlugin {
  return {
    name: 'tsnv:block-require',
    resolveId(id, importer, extraOptions) {
      if (extraOptions.kind === 'require-call') {
        throw new Error(
          [
            'CommonJS require call expressions are not allowed.',
            'Please use import statements instead.',
            '',
            `require('${id}') at '${importer ?? '<unknown file>'}'`,
          ].join('\n'),
        );
      }
    },
  };
}
