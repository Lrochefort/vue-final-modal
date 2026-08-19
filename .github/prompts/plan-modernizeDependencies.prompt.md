# Plan: Modernize vue-final-modal dependencies

Bring a ~2-year-stale pnpm monorepo current by upgrading in dependency order — toolchain floor first, then typechecker, bundler, linter, runtime libs — with a real CI gate added up front so each step is verifiable. Discovery turned up one big win: **every Vue Macro this library uses is now native in Vue 3.3+**, so `unplugin-vue-define-options` and likely `unplugin-vue-macros`/`@vue-macros/volar` can be deleted outright rather than upgraded.

### Phase 0 — Baseline + safety net *(blocks everything)*

1. Green baseline on current versions: install frozen, then `build:vfm`, `typecheck`, `test:vfm`. Anything already broken must be known before you start moving versions.
2. Add `.github/workflows/ci.yml` — today [.github/workflows/codeql-analysis.yml](.github/workflows/codeql-analysis.yml) is the **only** workflow, so there is no install/build/lint/test gate on PRs at all. Node 20+22 matrix, corepack, Chrome for the Cypress component run.
3. ~~Survey real latest versions~~ **DONE** — see the version table below. Re-run `pnpm audit` after the first successful install.
4. Zero-risk drift fix: [docs/package.json](docs/package.json#L15) and [viteplay/package.json](viteplay/package.json#L11) pin `workspace:4.5.4` while the package is at 4.5.5 → switch to `workspace:*`.

### Surveyed versions (`pnpm outdated -r`, 2026-08-19)

Local toolchain: **Node v24.18.0, pnpm 11.13.1**. `node_modules` is **not currently installed**; branch is `spike/update-upgrade-to-current-versions`.

| Package | Wanted | Latest | Jump |
| --- | --- | --- | --- |
| typescript | 5.3.3 | 7.0.2 → **cap at 6.0.3** | 1 major — TS 7 breaks vue-tsc |
| vue-tsc | 1.8.20 | **3.3.10** | 2 majors |
| eslint | 8.54.0 | **10.8.1** | 2 majors |
| @antfu/eslint-config | 0.37.0 | **9.3.0** | 9 majors |
| vite | 5.0.12 | **8.2.1** | 3 majors |
| @vitejs/plugin-vue | 4.5.0 | **6.0.8** | 2 majors |
| vite-plugin-dts | 3.6.3 | **5.0.3** | 2 majors |
| cypress | 13.6.4 | **15.21.0** | 2 majors |
| @cypress/vue | 5.0.5 | **6.0.3** | 1 major |
| vue | 3.3.9 | **3.5.41** | minor |
| @vueuse/core + integrations | 10.5.0 | **14.4.0** | 4 majors |
| focus-trap | 7.5.4 | **8.2.2** | 1 major |
| vue-router (viteplay) | 4.2.5 | **5.2.0** | 1 major |
| nuxt / @nuxt/kit / @nuxt/schema | 3.8.2 | **4.5.2** | 1 major |
| @nuxt/module-builder | 0.5.4 | **1.0.3** | 1 major |
| @nuxtjs/tailwindcss | 6.10.1 | **6.14.0** | minor |
| release-it | 16.2.1 | **21.0.2** | 5 majors |
| @release-it/conventional-changelog | 5.1.1 | **12.0.0** | 7 majors |
| concurrently | 8.2.2 | **10.0.5** | 2 majors |
| @types/node | 20.10.4 | **26.2.0** | 6 majors |
| pnpm | 8.11.0 | **11.22.0** | 3 majors |
| unplugin-vue-macros | 2.3.0 | 2.14.5 | — *(to be deleted, Phase 4)* |
| unplugin-vue-define-options | 1.3.8 | 3.1.4 | — *(to be deleted, Phase 4)* |
| @vue-macros/volar | 0.8.4 | 3.1.2 | — *(to be deleted, Phase 4)* |
| @nuxt-themes/docus | 1.15.0 | **1.15.0** | **no newer release exists** |
| @viteplay/plugin + @viteplay/vue | 0.2.9 | 0.2.9 | already current |

### Phase 1 — Runtime floor *(blocks 2–9)*

Add `.nvmrc` (24 — matches the local v24.18.0), `packageManager: pnpm@11.22.0`, `engines.node`; **remove `pnpm` from devDependencies** in [package.json](package.json#L27). Update `NODE_VERSION = "16"` → `"24"` in [netlify.toml](netlify.toml#L2) and simplify its `cd`-chained build command. pnpm 8 → 11 is three majors, so the lockfile is regenerated from scratch rather than migrated. Review [.npmrc](.npmrc): try dropping `shamefully-hoist=true`, and expect `strict-peer-dependencies=false` to still be needed while Docus lags.

### Phase 2 — TypeScript + vue-tsc *(blocks 3, 5, 6)*

`typescript` 5.3.3 → **6.0.3** and `vue-tsc` 1.8.20 → **3.3.10**.

**Do not go to TypeScript 7** — it breaks vue-tsc. 6.0.3 is the newest stable 6.x (there is no 6.1; every later publish is 7.x). Note that `vue-tsc@3.3.10` declares `peerDependencies: { "typescript": ">=5.0.0" }`, which is open-ended and will *not* stop a 7.x install — so pin `typescript` to `~6.0.3` rather than a caret range, and add a comment saying why, or the next routine bump silently reintroduces the break.

Also switch root [tsconfig.json](tsconfig.json) `moduleResolution` from legacy `node` → `bundler`, and drop the `unplugin-vue-define-options/macros-global` entry from `types` in [packages/vue-final-modal/tsconfig.json](packages/vue-final-modal/tsconfig.json) and [viteplay/tsconfig.json](viteplay/tsconfig.json). Two Volar majors will still surface new template type errors — fix them here before anything downstream moves.

### Phase 3 — Vite + build plugins *(depends on 2)*

Vite 5 → **8.2.1** (step through 6 and 7, don't jump), `@vitejs/plugin-vue` 4 → **6.0.8**, `vite-plugin-dts` 3 → **5.0.3**. The dts call in [packages/vue-final-modal/vite.config.ts](packages/vue-final-modal/vite.config.ts) is just `dts({ include: 'src' })` — two majors of option-shape drift, so confirm `dist/index.d.ts` still lands where the `types` field points. Keep the `external` list intact. Also bump `concurrently` 8 → 10 and `@types/node` 20 → 26 here.

### Phase 4 — Delete Vue Macros *(depends on 2; parallel with 5)*

Only `defineOptions`, `defineProps`, `defineEmits`, `defineSlots`, `defineExpose` are used — all native. Grep templates for `$v-model` short-vmodel first; if absent, remove all three `@vue-macros/volar` entries from `vueCompilerOptions` plus both unplugin deps, and reduce the vite configs to a plain `Vue()` plugin.

### Phase 5 — ESLint flat config *(parallel with 3/4)*

`eslint` 8 → **10.8.1** and `@antfu/eslint-config` 0.37 → **9.3.0** — nine majors, so treat this as adopting a new config rather than upgrading one. Replace [.eslintrc](.eslintrc) + `.eslintignore` with `eslint.config.js` built from antfu's current factory export, carrying over the two rule overrides. The `lint` script's `--ext=.ts,.vue` flag is invalid on ESLint 9+. Expect a very large auto-fix diff — keep the config change and the `--fix` churn as two separate commits so the reviewer can skip the churn commit.

### Phase 6 — Vue 3.5 + VueUse + focus-trap *(depends on 2, 3, 4)*

`vue` → **3.5.41** is only a minor. The real jumps are `@vueuse/core` + `@vueuse/integrations` 10 → **14.4.0** (four majors) and `focus-trap` 7 → **8.2.2**. The consumed surface is tiny (`useEventListener`, `tryOnUnmounted`, `useFocusTrap`) and the library uses zero internal Vue APIs, so the code churn should stay small — but four VueUse majors means `useFocusTrap`'s return shape (`.hasFocus`, `.activate()`, `.deactivate()`) must be re-verified against [useFocusTrap.ts](packages/vue-final-modal/src/components/VueFinalModal/useFocusTrap.ts). The real work is **widening `peerDependencies`** in [packages/vue-final-modal/package.json](packages/vue-final-modal/package.json#L48); bumping deps without widening `>=10.0.0` is the classic mistake. `vue-router` 4 → **5.2.0** in viteplay belongs here too.

### Phases 7–10

**7 — Cypress** 13 → **15.21.0** + `@cypress/vue` 5 → **6.0.3**; 4 specs, standard vite devServer, must also pass in the Phase 0 CI workflow.
**8 — Nuxt module**: `nuxt`/`@nuxt/kit`/`@nuxt/schema` 3.8.2 → **4.5.2**, `@nuxt/module-builder` 0.5.4 → **1.0.3**. `module.ts` uses only stable kit APIs; keep `@nuxt/kit` permissive since it's a published runtime dep.
**9 — Docs** last, see the Docus constraint below.
**10 —** `release-it` 16 → **21.0.2** and `@release-it/conventional-changelog` 5 → **12.0.0** (verify the plugin key shape in [.release-it.json](packages/vue-final-modal/.release-it.json) survives seven majors; add the missing one for `packages/nuxt`), examples, and moving `renovate.json` to the repo root — including a `packageRules` entry pinning `typescript` to `allowedVersions: "<7"` so the vue-tsc break can't come back in automatically.

**Verification per phase:** `pnpm build:vfm` emits `index.es.mjs`/`index.umd.js`/`index.d.ts`; `pnpm typecheck` clean workspace-wide; all 4 Cypress specs green; `pnpm generate:docs` renders; Nuxt playground builds.

**Decisions**

- Examples are **not** pnpm workspace members — they upgrade separately against published versions.
- Tailwind 4 stays out of scope; `@nuxtjs/tailwindcss` only needs 6.10 → 6.14 (a minor).
- **Nuxt 4 is now in scope for `packages/nuxt`.** The survey shows the Nuxt line has moved to **4.5.2** — there is no "latest 3.x" worth targeting anymore, so the earlier "defer Nuxt 4" decision is withdrawn for the published module. The module's `module.ts` only uses stable kit APIs, so this should be cheap.
- Dropping `unplugin-vue-define-options` means `peerDependencies.vue` should rise to `>=3.3.0` — a breaking peer change needing a changelog note.
- **Docs strategy: Option A, with a caveat the survey exposed.** `@nuxt-themes/docus` has **no release newer than the 1.15.0 already pinned** — it is abandoned, not merely stale, and it pins `@nuxt/content` 2.x, which will not run on Nuxt 4. So Option A degrades in practice to *freezing* [docs/](docs/) near its current Nuxt 3.8 line while everything else moves to Nuxt 4. Do not touch [docs/app.config.ts](docs/app.config.ts) or the pinceau [docs/tokens.config.ts](docs/tokens.config.ts). Accept that docs and the module will sit on different Nuxt majors for now; a Docus 2 / Nuxt UI Pro migration is a separate future project and is what actually unblocks docs.
- **Delivery: one large PR**, reviewed by an automated reviewer. Phase order becomes *commit* order inside that branch rather than separate PRs. Work continues on the existing `spike/update-upgrade-to-current-versions` branch.

**Single-PR working agreement**

Because everything lands in one branch, the phase boundaries have to be enforced by commits instead of by PRs:

- One commit per phase, each with a green `pnpm typecheck` + `pnpm build:vfm` + `pnpm test:vfm` at that commit — so a bisect still isolates the breaking phase.
- Keep mechanical churn (the ESLint `--fix` pass, lockfile regeneration) in its own commit, separate from the semantic change it accompanies. This is what keeps the diff reviewable at scale.
- Land the Phase 0 CI workflow in the *first* commit so every later commit is actually gated.
- Docs (Phase 9) goes in last. If Option A stalls on Docus, drop that commit and ship the rest — it must not hold the branch.

**Open risks**

- ~~Target versions are unverified guesses~~ — **resolved**, all targets above now come from an actual `pnpm outdated -r` run.
- ~~TypeScript 7 × vue-tsc 3 compatibility~~ — **resolved**: TS 7 breaks vue-tsc, so Phase 2 caps at `~6.0.3`. Residual risk is that vue-tsc's `>=5.0.0` peer range doesn't enforce this, so Renovate or a careless `pnpm up` can silently pull 7.x back in. Guard it with an exact-ish pin and a Renovate rule.
- **`node_modules` is not installed**, so the Phase 0 green baseline has not actually been established yet. Everything downstream assumes it passes — if the repo doesn't build on its *current* pins under Node 24, that has to be untangled before any version moves.
- The aggregate jump is still large (ESLint +2 majors, antfu config +9, Vite +3, VueUse +4, release-it +5). A single PR is workable but the per-phase commit discipline above stops being optional at this size.
