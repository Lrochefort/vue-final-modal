/**
 * Pure transform functions used by the CLI.
 *
 * The transforms are deliberately dependency-free. Rewriting module specifiers
 * is a string-level operation, so parsing every file with a JS/TS/SFC parser
 * would add a large dependency surface and — more importantly — would silently
 * skip files whose syntax the parser does not support. Anchoring the match on
 * `from`/`import`/`require(`/`import(` gives the precision we need without
 * either downside.
 */

/** Upstream package name -> fork package name. */
export const PACKAGE_RENAMES = new Map([
  ['vue-final-modal', '@lrochefort/vue-final-modal'],
  ['@vue-final-modal/nuxt', '@lrochefort/vue-final-modal-nuxt'],
])

/** Version range written into `package.json` for each fork package. */
export const TARGET_RANGES = new Map([
  ['@lrochefort/vue-final-modal', '^5.0.0'],
  ['@lrochefort/vue-final-modal-nuxt', '^2.0.0'],
])

/** Minimum versions this fork requires, used by the diagnostics pass. */
export const REQUIREMENTS = {
  node: '20.19.0',
  vue: '3.5.0',
  nuxt: '4.0.0',
}

export const SOURCE_EXTENSIONS = new Set([
  '.cjs',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.mts',
  '.ts',
  '.tsx',
  '.vue',
])

const IGNORED_DIRECTORIES = new Set([
  '.git',
  '.next',
  '.nuxt',
  '.output',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'node_modules',
])

/**
 * Matches the specifier of a static import/export, a `require()` call or a
 * dynamic `import()`. Capture groups: 1 = keyword, 2 = quote, 3 = specifier.
 */
const SPECIFIER_RE = /(\brequire\s*\(\s*|\bimport\s*\(\s*|\bfrom\s*|\bimport\s+)(['"])([^'"\n]+)\2/g

/** Matches any single- or double-quoted string. Only used for nuxt configs. */
const QUOTED_STRING_RE = /(['"])([^'"\n]+)\1/g

const NUXT_CONFIG_RE = /^nuxt\.config\.(?:[cm]?[jt]s)$/

/**
 * Map an upstream specifier to its fork equivalent, preserving any subpath
 * (`vue-final-modal/style.css` -> `@lrochefort/vue-final-modal/style.css`).
 *
 * @param {string} specifier
 * @returns {string | null} The renamed specifier, or `null` if unaffected.
 */
export function renameSpecifier(specifier) {
  for (const [oldName, newName] of PACKAGE_RENAMES) {
    if (specifier === oldName)
      return newName
    if (specifier.startsWith(`${oldName}/`))
      return newName + specifier.slice(oldName.length)
  }
  return null
}

/**
 * @param {string} fileName
 * @returns {boolean} Whether the file is a Nuxt config, where bare package
 * strings appear in `modules` / `css` arrays outside of import positions.
 */
export function isNuxtConfig(fileName) {
  return NUXT_CONFIG_RE.test(fileName)
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function isIgnoredDirectory(name) {
  return IGNORED_DIRECTORIES.has(name)
}

/**
 * Rewrite module specifiers in a source file.
 *
 * @param {string} code
 * @param {{ nuxtConfig?: boolean }} [options]
 * @returns {{ code: string, changes: number }}
 */
export function transformSource(code, options = {}) {
  let changes = 0

  let output = code.replace(SPECIFIER_RE, (match, keyword, quote, specifier) => {
    const renamed = renameSpecifier(specifier)
    if (renamed === null)
      return match
    changes += 1
    return `${keyword}${quote}${renamed}${quote}`
  })

  if (options.nuxtConfig) {
    output = output.replace(QUOTED_STRING_RE, (match, quote, value) => {
      const renamed = renameSpecifier(value)
      if (renamed === null)
        return match
      changes += 1
      return `${quote}${renamed}${quote}`
    })
  }

  return { code: output, changes }
}

/**
 * Rewrite dependency entries in a `package.json`.
 *
 * Operates on the raw text rather than `JSON.parse`/`JSON.stringify` so that
 * the file's existing indentation, key order and trailing newline survive.
 *
 * @param {string} code
 * @returns {{ code: string, changes: number }}
 */
export function transformPackageJson(code) {
  let changes = 0
  let output = code

  for (const [oldName, newName] of PACKAGE_RENAMES) {
    const range = TARGET_RANGES.get(newName)
    const entryRe = new RegExp(`(["'])${escapeRegExp(oldName)}\\1(\\s*:\\s*)(["'])[^"']*\\3`, 'g')
    output = output.replace(entryRe, (_match, quote, separator) => {
      changes += 1
      return `${quote}${newName}${quote}${separator}${quote}${range}${quote}`
    })
  }

  return { code: output, changes }
}

/**
 * @param {string} fileName
 * @param {string} code
 * @returns {{ code: string, changes: number }}
 */
export function transformFile(fileName, code) {
  if (fileName === 'package.json')
    return transformPackageJson(code)
  return transformSource(code, { nuxtConfig: isNuxtConfig(fileName) })
}

/**
 * Compare two dotted version strings.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} Negative if `a < b`, zero if equal, positive if `a > b`.
 */
export function compareVersions(a, b) {
  const left = a.split('.').map(part => Number.parseInt(part, 10) || 0)
  const right = b.split('.').map(part => Number.parseInt(part, 10) || 0)
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0)
    if (diff !== 0)
      return diff
  }
  return 0
}

/**
 * Extract the lowest version a semver range can resolve to. Returns `null` for
 * ranges we cannot reason about (`*`, `latest`, `workspace:*`, git URLs, upper
 * bounds such as `<4`, ...).
 *
 * @param {string} range
 * @returns {string | null}
 */
export function lowestVersionInRange(range) {
  const match = /^\s*(?:\^|~|>=?|=)?\s*(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(range)
  if (!match)
    return null
  return `${match[1]}.${match[2] ?? 0}.${match[3] ?? 0}`
}

/**
 * Report problems the codemod cannot fix on its own.
 *
 * @param {object} input
 * @param {Record<string, string>} input.dependencies Merged dependency map.
 * @param {string} input.nodeVersion
 * @param {string[]} input.cjsRequireFiles Files that `require()` the Nuxt module.
 * @returns {string[]} Human-readable warnings.
 */
export function diagnose({ dependencies, nodeVersion, cjsRequireFiles }) {
  const warnings = []

  if (compareVersions(nodeVersion.replace(/^v/, ''), REQUIREMENTS.node) < 0) {
    warnings.push(
      `Node ${nodeVersion} is below the required ${REQUIREMENTS.node}. Upgrade Node before installing.`,
    )
  }

  for (const [name, minimum] of [['vue', REQUIREMENTS.vue], ['nuxt', REQUIREMENTS.nuxt]]) {
    const range = dependencies[name]
    if (!range)
      continue
    const lowest = lowestVersionInRange(range)
    if (lowest && compareVersions(lowest, minimum) < 0) {
      warnings.push(
        `"${name}": "${range}" allows ${lowest}, but this release requires ${name} >= ${minimum}. Update it manually.`,
      )
    }
  }

  for (const file of cjsRequireFiles) {
    warnings.push(
      `${file} uses require() for the Nuxt module, which is now ESM-only. Convert the file to ESM or use a dynamic import().`,
    )
  }

  return warnings
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
