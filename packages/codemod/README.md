# @lrochefort/vue-final-modal-codemod

Migrates a project from `vue-final-modal` 4.x to [`@lrochefort/vue-final-modal`](https://www.npmjs.com/package/@lrochefort/vue-final-modal) 5.x.

The 5.0 release contains **no runtime API changes** — every component, composable, prop, event and slot behaves exactly as it did in `4.5.5`. The only breaking change is the package name, because this fork cannot publish under the upstream name. This codemod performs that rename and then reports anything it cannot fix for you.

## Usage

```bash
# preview the changes
npx @lrochefort/vue-final-modal-codemod@latest --dry-run

# apply them
npx @lrochefort/vue-final-modal-codemod@latest

# target a specific directory
npx @lrochefort/vue-final-modal-codemod@latest ./apps/web
```

| Option            | Description                                    |
| ----------------- | ---------------------------------------------- |
| `-d`, `--dry-run` | Report the changes without writing any files.  |
| `-h`, `--help`    | Show usage.                                    |

Commit or stash your work first — the codemod rewrites files in place.

## What it changes

| Location                                                | Change                                                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `.ts` `.tsx` `.mts` `.cts` `.js` `.jsx` `.mjs` `.cjs` `.vue` | `import` / `export … from` / `require()` / `import()` specifiers                                     |
| `nuxt.config.*`                                          | `modules` and `css` array entries                                                                    |
| `package.json`                                           | Dependency keys, with the version range set to `^5.0.0` / `^2.0.0`                                  |

Renames applied:

| Before                       | After                                     |
| ---------------------------- | ----------------------------------------- |
| `vue-final-modal`            | `@lrochefort/vue-final-modal`             |
| `vue-final-modal/style.css`  | `@lrochefort/vue-final-modal/style.css`   |
| `@vue-final-modal/nuxt`      | `@lrochefort/vue-final-modal-nuxt`        |

Any subpath is preserved, so an import of `vue-final-modal/anything` becomes `@lrochefort/vue-final-modal/anything`.

`node_modules`, `dist`, `build`, `coverage`, `.git`, `.nuxt`, `.output`, `.next`, `.turbo` and `.vercel` are skipped.

## What it reports but does not change

The codemod prints a "manual follow-up" section for the requirements it cannot satisfy automatically:

- **Vue below 3.5.0** — required by `@vueuse/core` 14.
- **Nuxt below 4.0.0** — required by `@lrochefort/vue-final-modal-nuxt`.
- **Node below 20.19.0** — enforced by the `engines` field.
- **`require()` of the Nuxt module** — it is now ESM-only. Convert the file to ESM or use a dynamic `import()`.

## Design notes

The transforms are dependency-free and operate on source text anchored to `from` / `import` / `require(` / `import(`, rather than on a parsed AST.

Rewriting a module specifier is a string-level edit, so an AST buys little accuracy here, while a parser would add a large dependency surface to a tool people run through `npx` and — more importantly — would silently skip any file whose syntax it does not support (newer TypeScript syntax, unusual SFC blocks, and so on). The anchoring is what keeps the match precise: a bare `'vue-final-modal'` string, such as a CSS class name, is left alone outside of `nuxt.config.*`, where `modules` and `css` arrays legitimately hold bare package names.

## Development

```bash
pnpm --filter @lrochefort/vue-final-modal-codemod test
```

## License

MIT
