<div align="center">

# tsnv

Modern bundler for React Native libraries - fast, platform-aware, zero-config<br>
(powered by [Rolldown](https://rolldown.rs))

</div>

> [!NOTE]
> This project is under development

## Installation

```bash
# npm
npm i --dev tsnv

# pnpm
pnpm add -D tsnv

# yarn
yarn add -D tsnv
```

## Usage

> TBD

```ts
// tsnv.config.ts
import { defineConfig } from 'tsnv';

export default defineConfig({
  source: 'src',
  outDir: 'dist',
  format: ['esm', 'cjs'],
  dts: true,
});
```

## License

[MIT](./LICENSE)
