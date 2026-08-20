#!/usr/bin/env node
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { parseArgs } from 'node:util'

import {
  SOURCE_EXTENSIONS,
  diagnose,
  isIgnoredDirectory,
  transformFile,
} from '../src/index.mjs'

const USAGE = `
vue-final-modal-codemod

Migrates a project from vue-final-modal 4.x to @lrochefort/vue-final-modal 5.x.

Usage
  npx @lrochefort/vue-final-modal-codemod@latest [directory] [options]

Options
  -d, --dry-run   Report the changes without writing any files.
  -h, --help      Show this message.
`

async function main() {
  let parsed
  try {
    parsed = parseArgs({
      allowPositionals: true,
      options: {
        'dry-run': { type: 'boolean', short: 'd', default: false },
        'help': { type: 'boolean', short: 'h', default: false },
      },
    })
  }
  catch (error) {
    process.stderr.write(`${error.message}\n${USAGE}`)
    process.exitCode = 1
    return
  }

  if (parsed.values.help) {
    process.stdout.write(USAGE)
    return
  }

  const dryRun = parsed.values['dry-run']
  const root = path.resolve(process.cwd(), parsed.positionals[0] ?? '.')

  const changedFiles = []
  const cjsRequireFiles = []
  let scanned = 0

  for await (const filePath of walk(root)) {
    const fileName = path.basename(filePath)
    if (fileName !== 'package.json' && !SOURCE_EXTENSIONS.has(path.extname(filePath)))
      continue

    scanned += 1
    const original = await readFile(filePath, 'utf8')
    const { code, changes } = transformFile(fileName, original)
    if (changes === 0)
      continue

    const relative = path.relative(root, filePath) || fileName
    changedFiles.push({ relative, changes })

    if (/require\s*\(\s*(['"])@lrochefort\/vue-final-modal-nuxt\1/.test(code))
      cjsRequireFiles.push(relative)

    if (!dryRun)
      await writeFile(filePath, code)
  }

  report({ root, scanned, changedFiles, cjsRequireFiles, dryRun })
}

/**
 * Recursively yield every file under `directory`, skipping build output and
 * dependency folders.
 *
 * @param {string} directory
 * @returns {AsyncGenerator<string>}
 */
async function* walk(directory) {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  }
  catch {
    return
  }

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      if (isIgnoredDirectory(entry.name))
        continue
      yield* walk(entryPath)
    }
    else if (entry.isFile()) {
      yield entryPath
    }
  }
}

/**
 * @param {string} root
 * @returns {Promise<Record<string, string>>}
 */
async function readRootDependencies(root) {
  try {
    const manifest = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
    return {
      ...manifest.dependencies,
      ...manifest.devDependencies,
      ...manifest.peerDependencies,
    }
  }
  catch {
    return {}
  }
}

async function report({ root, scanned, changedFiles, cjsRequireFiles, dryRun }) {
  const out = process.stdout

  out.write(`\nScanned ${scanned} file${scanned === 1 ? '' : 's'} in ${root}\n`)

  if (changedFiles.length === 0) {
    out.write('No references to vue-final-modal or @vue-final-modal/nuxt were found.\n')
  }
  else {
    const total = changedFiles.reduce((sum, file) => sum + file.changes, 0)
    const verb = dryRun ? 'Would update' : 'Updated'
    out.write(`${verb} ${changedFiles.length} file${changedFiles.length === 1 ? '' : 's'} (${total} reference${total === 1 ? '' : 's'}):\n`)
    for (const file of changedFiles)
      out.write(`  ${file.relative} (${file.changes})\n`)
  }

  const warnings = diagnose({
    dependencies: await readRootDependencies(root),
    nodeVersion: process.versions.node,
    cjsRequireFiles,
  })

  if (warnings.length > 0) {
    out.write('\nManual follow-up required:\n')
    for (const warning of warnings)
      out.write(`  - ${warning}\n`)
  }

  if (dryRun) {
    out.write('\nDry run - no files were written. Re-run without --dry-run to apply.\n')
  }
  else if (changedFiles.length > 0) {
    out.write('\nNext step: reinstall dependencies so the renamed packages are resolved.\n')
  }
}

await main()
