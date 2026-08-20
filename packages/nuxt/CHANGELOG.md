
# 2.0.0 (2026-08-19)

First release of the `@lrochefort` fork of `@vue-final-modal/nuxt`.

The module's behaviour is unchanged: it registers the vue-final-modal plugin, transpiles the runtime and injects the required stylesheet. All breaking changes below are to the package name and the supported toolchain. See the [migration guide](https://github.com/Lrochefort/vue-final-modal/blob/master/docs/content/2.get-started/1.guide/3.migration-guide.md).


### BREAKING CHANGES

* **package renamed:** `@vue-final-modal/nuxt` is now published as `@lrochefort/vue-final-modal-nuxt`. Update the `modules` array in your `nuxt.config`. The `vue-final-modal` config key is unchanged.
* **nuxt:** the minimum supported Nuxt version is now `4.0.0`, raised from `3.0.0`.
* **esm-only:** the module is now ESM-only. `@nuxt/module-builder` 1.x no longer emits a CommonJS build, so `dist/module.cjs` is gone and the `require` condition has been removed from the `exports` map. Load the module with `import` rather than `require()`.
* **node:** the minimum supported Node.js version is now `20.19.0`.
* **peer:** requires `@lrochefort/vue-final-modal` `>=5.0.0`.


### Build System

* upgrade to `@nuxt/kit` 4 and `@nuxt/module-builder` 1 ([d122fa9](https://github.com/Lrochefort/vue-final-modal/commit/d122fa9))
