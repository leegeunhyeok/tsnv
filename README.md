<div align="center">

# tsnv

Modern build toolkit for React Native libraries<br>
(powered by [Rolldown](https://rolldown.rs))

</div>

> [!NOTE]
> This project is under development

## Features

- **Fast** - Powered by [Rolldown](https://rolldown.rs), a Rust-based bundler
- **Platform-aware** - Automatic handling of platform-specific modules (`.android.ts`, `.ios.ts`, `.native.ts`)
- **Dual format** - Supports both CommonJS and ESM output
- **TypeScript** - First-class TypeScript support with automatic `.d.ts` generation
- **Zero-config** - Sensible defaults that just work
- **Yarn PnP** - Works seamlessly with Yarn Plug'n'Play

## Installation

```bash
# npm
npm i -D tsnv

# pnpm
pnpm add -D tsnv

# yarn
yarn add -D tsnv
```

## Quick Start

Just run:

```bash
npx tsnv
```

That's it. tsnv works out of the box with sensible defaults:

- Source directory: `src`
- Output directory: `dist`
- Format: ESM
- TypeScript declarations: enabled

### Custom Configuration (Optional)

If you need to customize the build, create a `tsnv.config.ts`:

```ts
import { defineConfig } from 'tsnv';

export default defineConfig({
  format: ['esm', 'cjs'],
  sourcemap: true,
});
```

## Configuration

All configuration options with their default values:

```ts
import { defineConfig } from 'tsnv';

export default defineConfig({
  // Source directory
  source: 'src',

  // Output directory
  outDir: 'dist',

  // Output format: 'esm', 'cjs', or ['esm', 'cjs']
  format: 'esm',

  // Generate TypeScript declaration files
  dts: true,

  // Platform specifiers for module resolution
  specifiers: ['android', 'ios', 'native'],

  // Source file extensions
  sourceExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Asset file extensions (Metro defaults)
  assetExtensions: ['bmp', 'gif', 'jpg', 'jpeg', 'png', 'psd', 'svg', 'webp' /* ... */],

  // Files to exclude from the build
  exclude: /__(?:tests?|fixtures?|mocks?)__/,

  // Generate source maps
  sourcemap: false,

  // Clean output directory before build
  clean: true,

  // Code injection options
  banner: undefined,
  footer: undefined,
  intro: undefined,
  outro: undefined,

  // Experimental options
  experimental: {
    tsgo: false, // Use tsgo compiler
  },
});
```

## Output Structure

### ESM only (`format: 'esm'`)

```
dist/
├── index.js
├── greeting.android.js
├── greeting.ios.js
└── types/
    ├── index.d.ts
    ├── greeting.android.d.ts
    └── greeting.ios.d.ts
```

### CommonJS only (`format: 'cjs'`)

```
dist/
├── index.js
├── greeting.android.js
├── greeting.ios.js
└── types/
    ├── index.d.ts
    ├── greeting.android.d.ts
    └── greeting.ios.d.ts
```

### Dual format (`format: ['esm', 'cjs']`)

```
dist/
├── esm/
│   ├── index.js
│   ├── greeting.android.js
│   └── greeting.ios.js
├── cjs/
│   ├── index.js
│   ├── greeting.android.js
│   └── greeting.ios.js
└── types/
    ├── index.d.ts
    ├── greeting.android.d.ts
    └── greeting.ios.d.ts
```

## License

[MIT](./LICENSE)
