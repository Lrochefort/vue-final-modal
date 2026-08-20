# Changelog

## 1.0.0

Initial release.

### Features

* rewrite `import`, `export … from`, `require()` and `import()` specifiers in `.ts`, `.tsx`, `.mts`, `.cts`, `.js`, `.jsx`, `.mjs`, `.cjs` and `.vue` files
* rewrite `modules` and `css` entries in `nuxt.config.*`
* rewrite `package.json` dependency entries to `@lrochefort/vue-final-modal@^5.0.0` and `@lrochefort/vue-final-modal-nuxt@^2.0.0`, preserving the file's existing formatting
* preserve subpaths, so `vue-final-modal/style.css` becomes `@lrochefort/vue-final-modal/style.css`
* `--dry-run` to preview changes without writing
* diagnostics for the requirements the codemod cannot satisfy automatically: Vue `< 3.5.0`, Nuxt `< 4.0.0`, Node `< 20.19.0`, and `require()` of the now ESM-only Nuxt module
