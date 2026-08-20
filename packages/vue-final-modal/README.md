# Vue Final Modal 5

The most powerful yet most light-weight modal library for Vue 3.

> [!IMPORTANT]
> **This is an unofficial fork of [vue-final/vue-final-modal](https://github.com/vue-final/vue-final-modal).**
>
> Upstream has not published a release since September 2024 (`4.5.5`). This fork exists to keep the library working on a current toolchain: Vue 3.5, Vite 8, TypeScript 6, Nuxt 4 and Node 20.19+.
>
> Because the upstream package names are owned by the original author, this fork publishes under its own scope:
>
> | Upstream                | This fork                          |
> | ----------------------- | ---------------------------------- |
> | `vue-final-modal`       | `@lrochefort/vue-final-modal`      |
> | `@vue-final-modal/nuxt` | `@lrochefort/vue-final-modal-nuxt` |
>
> **There are no runtime API changes.** Every component, composable, prop, event and slot behaves exactly as it did in `4.5.5`. Upgrading is a rename.

<p align="center">
  <a href="https://www.npmjs.com/package/@lrochefort/vue-final-modal"><img src="https://badgen.net/npm/v/@lrochefort/vue-final-modal/latest" alt="Version"></a>
  <a href="https://npmcharts.com/compare/@lrochefort/vue-final-modal?minimal=true"><img src="https://badgen.net/npm/dm/@lrochefort/vue-final-modal" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/@lrochefort/vue-final-modal"><img src="https://img.shields.io/npm/l/@lrochefort/vue-final-modal.svg?sanitize=true" alt="License"></a>
</p>

## Requirements

| Requirement | Minimum version | Notes                                       |
| ----------- | --------------- | ------------------------------------------- |
| Node.js     | `20.19.0`       | Enforced via `engines`                      |
| Vue         | `3.5.0`         | Required by `@vueuse/core` 14               |
| Nuxt        | `4.0.0`         | Only for `@lrochefort/vue-final-modal-nuxt` |

`@vueuse/core`, `@vueuse/integrations` (`>=10`) and `focus-trap` (`>=7.2`) are peer dependencies and are installed for you by default.

## Installation

```bash
# npm
npm install @lrochefort/vue-final-modal

# pnpm
pnpm add @lrochefort/vue-final-modal

# yarn
yarn add @lrochefort/vue-final-modal
```

For Nuxt 4, also install the module:

```bash
npm install @lrochefort/vue-final-modal-nuxt
```

## Quick start

### Vue 3

```ts
// main.ts
import { createApp } from 'vue'
import { createVfm } from '@lrochefort/vue-final-modal'
import '@lrochefort/vue-final-modal/style.css'
import App from './App.vue'

createApp(App).use(createVfm()).mount('#app')
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { ModalsContainer } from '@lrochefort/vue-final-modal'
</script>

<template>
  <div>
    <ModalsContainer />
  </div>
</template>
```

### Nuxt 4

The module registers the plugin and injects the stylesheet for you:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@lrochefort/vue-final-modal-nuxt'],
})
```

## Migrating from 4.x to 5.0

A codemod handles the rename:

```bash
# preview the changes
npx @lrochefort/vue-final-modal-codemod@latest --dry-run

# apply them
npx @lrochefort/vue-final-modal-codemod@latest
```

It rewrites import specifiers in `.ts`, `.js`, `.mjs`, `.cjs` and `.vue` files, updates `package.json` and `nuxt.config`, then reports anything it cannot fix automatically. See the [full migration guide](https://github.com/Lrochefort/vue-final-modal/blob/master/docs/content/2.get-started/1.guide/3.migration-guide.md) for the manual steps.

## Playground

- [Stackblitz for Vue 3](https://stackblitz.com/github/Lrochefort/vue-final-modal/tree/master/examples/vue3)
- [Stackblitz for Nuxt 4](https://stackblitz.com/github/Lrochefort/vue-final-modal/tree/master/examples/nuxt3)

## Documentation

The documentation site is maintained upstream at [vue-final-modal.org](https://vue-final-modal.org/). It is accurate for this fork apart from the package names: substitute `@lrochefort/vue-final-modal` wherever it says `vue-final-modal`.

Looking for old version?

- [vue-final-modal@3.x for Vue 3](https://v3.vue-final-modal.org/)
- [vue-final-modal@2.x for Vue 2](https://v2.vue-final-modal.org/)

## Contributing

See the [contribution guide](https://github.com/Lrochefort/vue-final-modal#contribution-guide) in the repository.

## Credits

`vue-final-modal` was created by [Hunter Liu](https://github.com/hunterliu1003) and its contributors. This fork exists only to keep their work running on current tooling; all credit for the library belongs to them.

<a href="https://github.com/vue-final/vue-final-modal/graphs/contributors" aria-label="contributors">
  <img src="https://contrib.rocks/image?repo=vue-final/vue-final-modal" alt="contributors" />
</a>

Made with [contributors-img](https://contrib.rocks).

If you find this library useful, consider supporting the original author:

<a href="https://www.buymeacoffee.com/PL2qJIx" target="_blank" rel="noopener noreferrer">
  <img width="200" src="https://cdn.buymeacoffee.com/buttons/v2/default-green.png" alt="Buy Me A Coffee" />
</a>

If you have any ideas for optimization of this fork, feel free to open [issues](https://github.com/Lrochefort/vue-final-modal/issues) or [pull requests](https://github.com/Lrochefort/vue-final-modal/pulls).

## License

MIT - Copyright (c) 2018-present, Chung Hang (Hunter) Liu
