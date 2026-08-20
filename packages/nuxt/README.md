# @lrochefort/vue-final-modal-nuxt

Nuxt 4 module for [`@lrochefort/vue-final-modal`](https://www.npmjs.com/package/@lrochefort/vue-final-modal).

> [!IMPORTANT]
> **This is an unofficial fork of `@vue-final-modal/nuxt`.**
>
> The upstream package name is owned by the original author, so this fork publishes as `@lrochefort/vue-final-modal-nuxt`. The module's behaviour is unchanged and the `vue-final-modal` config key is the same.

<p align="center">
  <a href="https://www.npmjs.com/package/@lrochefort/vue-final-modal-nuxt"><img src="https://badgen.net/npm/v/@lrochefort/vue-final-modal-nuxt/latest" alt="Version"></a>
  <a href="https://www.npmjs.com/package/@lrochefort/vue-final-modal-nuxt"><img src="https://img.shields.io/npm/l/@lrochefort/vue-final-modal-nuxt.svg?sanitize=true" alt="License"></a>
</p>

## Requirements

| Requirement                   | Minimum version |
| ----------------------------- | --------------- |
| Node.js                       | `20.19.0`       |
| Nuxt                          | `4.0.0`         |
| `@lrochefort/vue-final-modal` | `5.0.0`         |

This module is **ESM-only**. Load it with `import`, not `require()`.

## Installation

```bash
# npm
npm install @lrochefort/vue-final-modal-nuxt

# pnpm
pnpm add @lrochefort/vue-final-modal-nuxt

# yarn
yarn add @lrochefort/vue-final-modal-nuxt
```

## Usage

Add the module to your `nuxt.config`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@lrochefort/vue-final-modal-nuxt'],
})
```

The module does three things for you:

1. Registers the vue-final-modal plugin created by `createVfm()`.
2. Transpiles the runtime.
3. Appends `@lrochefort/vue-final-modal/style.css` to `nuxt.options.css`.

You still need to place `<ModalsContainer />` once in your Vue tree if you use `useModal()`:

```vue
<!-- layouts/default.vue -->
<script setup lang="ts">
import { ModalsContainer } from '@lrochefort/vue-final-modal'
</script>

<template>
  <div>
    <slot />
    <ModalsContainer />
  </div>
</template>
```

## Migrating from `@vue-final-modal/nuxt`

```bash
npx @lrochefort/vue-final-modal-codemod@latest
```

See the [full migration guide](https://github.com/Lrochefort/vue-final-modal/blob/master/docs/content/2.get-started/1.guide/3.migration-guide.md).

## Development

- Run `pnpm dev:prepare` to generate type stubs.
- Use `pnpm dev` to start the [playground](./playground) in development mode.

## Credits

`vue-final-modal` and its Nuxt module were created by [Hunter Liu](https://github.com/hunterliu1003) and its contributors.

## License

MIT - Copyright (c) 2018-present, Chung Hang (Hunter) Liu
