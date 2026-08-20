import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  compareVersions,
  diagnose,
  isNuxtConfig,
  lowestVersionInRange,
  renameSpecifier,
  transformPackageJson,
  transformSource,
} from '../src/index.mjs'

describe('renameSpecifier', () => {
  it('renames the bare package', () => {
    assert.equal(renameSpecifier('vue-final-modal'), '@lrochefort/vue-final-modal')
  })

  it('preserves subpaths', () => {
    assert.equal(
      renameSpecifier('vue-final-modal/style.css'),
      '@lrochefort/vue-final-modal/style.css',
    )
  })

  it('renames the nuxt module', () => {
    assert.equal(renameSpecifier('@vue-final-modal/nuxt'), '@lrochefort/vue-final-modal-nuxt')
  })

  it('leaves unrelated specifiers alone', () => {
    assert.equal(renameSpecifier('vue'), null)
    assert.equal(renameSpecifier('vue-final-modal-plugin'), null)
  })
})

describe('transformSource', () => {
  it('rewrites static imports, side-effect imports and re-exports', () => {
    const input = [
      `import { VueFinalModal } from 'vue-final-modal'`,
      `import 'vue-final-modal/style.css'`,
      `import type { ModalSlot } from "vue-final-modal"`,
      `export { useModal } from 'vue-final-modal'`,
    ].join('\n')

    const { code, changes } = transformSource(input)

    assert.equal(changes, 4)
    assert.equal(code, [
      `import { VueFinalModal } from '@lrochefort/vue-final-modal'`,
      `import '@lrochefort/vue-final-modal/style.css'`,
      `import type { ModalSlot } from "@lrochefort/vue-final-modal"`,
      `export { useModal } from '@lrochefort/vue-final-modal'`,
    ].join('\n'))
  })

  it('rewrites require() and dynamic import()', () => {
    const input = [
      `const vfm = require('vue-final-modal')`,
      `const lazy = await import('vue-final-modal')`,
    ].join('\n')

    const { code, changes } = transformSource(input)

    assert.equal(changes, 2)
    assert.match(code, /require\('@lrochefort\/vue-final-modal'\)/)
    assert.match(code, /import\('@lrochefort\/vue-final-modal'\)/)
  })

  it('rewrites imports inside a single-file component', () => {
    const input = [
      `<script setup lang="ts">`,
      `import { VueFinalModal } from 'vue-final-modal'`,
      `</script>`,
      ``,
      `<template>`,
      `  <VueFinalModal class="vue-final-modal" />`,
      `</template>`,
    ].join('\n')

    const { code, changes } = transformSource(input)

    assert.equal(changes, 1)
    assert.match(code, /from '@lrochefort\/vue-final-modal'/)
    // The class name is not an import specifier and must survive untouched.
    assert.match(code, /class="vue-final-modal"/)
  })

  it('does not touch bare strings outside import positions', () => {
    const input = `const id = 'vue-final-modal'`
    const { code, changes } = transformSource(input)

    assert.equal(changes, 0)
    assert.equal(code, input)
  })

  it('rewrites nuxt config module and css arrays', () => {
    const input = [
      `export default defineNuxtConfig({`,
      `  modules: ['@vue-final-modal/nuxt'],`,
      `  css: ['vue-final-modal/style.css'],`,
      `})`,
    ].join('\n')

    const { code, changes } = transformSource(input, { nuxtConfig: true })

    assert.equal(changes, 2)
    assert.match(code, /modules: \['@lrochefort\/vue-final-modal-nuxt'\]/)
    assert.match(code, /css: \['@lrochefort\/vue-final-modal\/style\.css'\]/)
  })

  it('does not double-count a specifier already rewritten by the import pass', () => {
    const input = `import '@vue-final-modal/nuxt'`
    const { code, changes } = transformSource(input, { nuxtConfig: true })

    assert.equal(changes, 1)
    assert.equal(code, `import '@lrochefort/vue-final-modal-nuxt'`)
  })
})

describe('transformPackageJson', () => {
  it('renames dependencies and pins the new ranges', () => {
    const input = JSON.stringify({
      dependencies: { 'vue': '^3.4.0', 'vue-final-modal': '^4.5.5' },
      devDependencies: { '@vue-final-modal/nuxt': '^1.0.3' },
    }, null, 2)

    const { code, changes } = transformPackageJson(input)
    const manifest = JSON.parse(code)

    assert.equal(changes, 2)
    assert.equal(manifest.dependencies['@lrochefort/vue-final-modal'], '^5.0.0')
    assert.equal(manifest.devDependencies['@lrochefort/vue-final-modal-nuxt'], '^2.0.0')
    assert.equal(manifest.dependencies.vue, '^3.4.0')
    assert.equal(manifest.dependencies['vue-final-modal'], undefined)
  })

  it('preserves formatting of untouched lines', () => {
    const input = '{\n    "dependencies": {\n        "vue-final-modal": "4.5.5"\n    }\n}\n'
    const { code } = transformPackageJson(input)

    assert.equal(code, '{\n    "dependencies": {\n        "@lrochefort/vue-final-modal": "^5.0.0"\n    }\n}\n')
  })
})

describe('isNuxtConfig', () => {
  it('matches every nuxt config extension', () => {
    for (const name of ['nuxt.config.ts', 'nuxt.config.js', 'nuxt.config.mjs', 'nuxt.config.cts'])
      assert.equal(isNuxtConfig(name), true, name)
  })

  it('rejects other files', () => {
    assert.equal(isNuxtConfig('vite.config.ts'), false)
    assert.equal(isNuxtConfig('nuxt.config.json'), false)
  })
})

describe('version helpers', () => {
  it('compares dotted versions', () => {
    assert.ok(compareVersions('3.4.0', '3.5.0') < 0)
    assert.ok(compareVersions('3.5.0', '3.5.0') === 0)
    assert.ok(compareVersions('20.19.0', '20.9.0') > 0)
  })

  it('extracts the lowest satisfying version', () => {
    assert.equal(lowestVersionInRange('^3.4.0'), '3.4.0')
    assert.equal(lowestVersionInRange('~3.4'), '3.4.0')
    assert.equal(lowestVersionInRange('>=20.19.0'), '20.19.0')
    assert.equal(lowestVersionInRange('4'), '4.0.0')
  })

  it('gives up on ranges it cannot reason about', () => {
    assert.equal(lowestVersionInRange('latest'), null)
    assert.equal(lowestVersionInRange('workspace:*'), null)
    assert.equal(lowestVersionInRange('*'), null)
  })
})

describe('diagnose', () => {
  it('flags an outdated vue range', () => {
    const warnings = diagnose({
      dependencies: { vue: '^3.4.0' },
      nodeVersion: '22.0.0',
      cjsRequireFiles: [],
    })

    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /requires vue >= 3\.5\.0/)
  })

  it('flags nuxt 3 and an outdated node', () => {
    const warnings = diagnose({
      dependencies: { nuxt: '^3.12.0' },
      nodeVersion: 'v20.9.0',
      cjsRequireFiles: [],
    })

    assert.equal(warnings.length, 2)
    assert.match(warnings[0], /Node v20\.9\.0 is below/)
    assert.match(warnings[1], /requires nuxt >= 4\.0\.0/)
  })

  it('flags cjs consumers of the esm-only nuxt module', () => {
    const warnings = diagnose({
      dependencies: {},
      nodeVersion: '22.0.0',
      cjsRequireFiles: ['scripts/build.cjs'],
    })

    assert.equal(warnings.length, 1)
    assert.match(warnings[0], /ESM-only/)
  })

  it('stays quiet on a compliant project', () => {
    const warnings = diagnose({
      dependencies: { nuxt: '^4.0.0', vue: '^3.5.41' },
      nodeVersion: '22.0.0',
      cjsRequireFiles: [],
    })

    assert.deepEqual(warnings, [])
  })
})
