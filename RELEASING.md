# Releasing

Three packages are published from this repository:

| Package                                | Directory                  | Tag prefix  |
| -------------------------------------- | -------------------------- | ----------- |
| `@lrochefort/vue-final-modal`          | `packages/vue-final-modal` | `v`         |
| `@lrochefort/vue-final-modal-nuxt`     | `packages/nuxt`            | `nuxt-v`    |
| `@lrochefort/vue-final-modal-codemod`  | `packages/codemod`         | `codemod-v` |

Each is versioned independently.

## Branching model

`develop` is the integration branch — contributors open pull requests against it. `master` holds released code only.

```
feature/*  ──PR──▶  develop  ──cut──▶  release/5.0.0  ──merge──▶  master
                       ▲                     │
                       └────back-merge───────┘
```

An npm package has no QA/UAT environments: once a version is published it is immutable and immediately installable by everyone. The staging equivalent is the **dist-tag**, so the promotion path runs through npm rather than through deployments:

| Stage | Action                                   | dist-tag | Consumers get it via                        |
| ----- | ---------------------------------------- | -------- | ------------------------------------------- |
| QA    | tag `v5.0.0-rc.1` on `release/5.0.0`     | `next`   | `npm i @lrochefort/vue-final-modal@next`    |
| UAT   | tag `v5.0.0-rc.2` … as fixes land        | `next`   | same                                        |
| Prod  | tag `v5.0.0`                             | `latest` | `npm i @lrochefort/vue-final-modal`         |

The workflow derives the dist-tag from the version: anything with a prerelease identifier goes to `next`, everything else to `latest`. A plain `npm install` therefore never picks up a release candidate.

After the final tag, merge `release/5.0.0` into `master` **and** back into `develop` so the version bump and changelog are not lost.

## How it works

`release-it` runs **locally**. It bumps the version, writes the changelog, commits, tags and creates the GitHub Release. It does **not** publish — `npm.publish` is `false` in every `.release-it.json`.

Pushing the tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which is the only thing that talks to the npm registry. Keeping the publish step in CI means the npm token never lives on a developer machine and npm can attach a [provenance attestation](https://docs.npmjs.com/generating-provenance-statements) to the tarball.

## One-time setup

These steps span two different websites — npmjs.com for the token, github.com for everything else.

### 1. The repository must be public

npm provenance fails on private repositories. Check under *Settings → General → Danger Zone*.

### 2. The release work must be on `develop` or a release branch

`release-it` accepts `release/*` and `master` via `git.requireBranch`, and the workflow resolves package directories and names that only exist once the rename has landed. Merge the release branch as a unit — merging the workflow files on their own leaves CI running steps whose scripts do not exist yet.

Note that a **tag** push runs the workflow file present at the tagged commit, so `release.yml` does not have to be on the default branch to fire. The default branch matters for `workflow_dispatch`, `schedule`, and for which workflows the Actions tab lists.

### 3. Actions must be enabled

This repository is a fork, and GitHub disables Actions on forks by default. Go to **Settings → Actions → General** (`https://github.com/Lrochefort/vue-final-modal/settings/actions`) and confirm *Allow all actions and reusable workflows* is selected.

Some forks instead show a one-time *"I understand my workflows, go ahead and enable them"* banner on the Actions tab; clicking it does the same thing. The Settings page is authoritative, so check there if no banner appears.

To confirm Actions can see the workflows:

```bash
curl -s https://api.github.com/repos/Lrochefort/vue-final-modal/actions/workflows \
  | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=JSON.parse(s);console.log(r.total_count);(r.workflows||[]).forEach(w=>console.log(w.path,w.state))})"
```

A `total_count` of `0` means either the workflow files are not on the default branch yet or Actions is still disabled.

### 4. Set `develop` as the default branch

So that contributor pull requests target `develop` rather than `master`: **Settings → General → Default branch** → switch to `develop`.

### 5. Create the npm token

On **npmjs.com**: avatar (top-right) → **Access Tokens** → **Generate New Token** → **Granular Access Token**. Set an expiry, then under *Packages and scopes* grant **Read and write** on the `@lrochefort` scope. The value is displayed once.

### 6. Store it as a GitHub secret

On **github.com**: `https://github.com/Lrochefort/vue-final-modal/settings/secrets/actions` → **New repository secret** → name it exactly `NPM_TOKEN` and paste the value.

Manually that is: repo → **Settings** tab (in the repo's top bar, after Insights — not your account settings) → sidebar → **Secrets and variables** → **Actions**.

Paste the token nowhere else. It should never reach your shell history, a file in this repo, or a chat window.

### 7. Switch to Trusted Publishing after the first successful publish

Once each package exists on the registry, configure npm Trusted Publishing for this repository and workflow, then delete the `NPM_TOKEN` secret and drop the `NODE_AUTH_TOKEN` env from the workflow. OIDC removes the long-lived credential entirely.

## Releasing

Cut the release branch from `develop`, then run `release-it` on it:

```bash
git checkout develop && git pull
git checkout -b release/5.0.0

# tags must be present, otherwise release-it cannot determine the
# previous version and will compute 0.0.1
git fetch --tags

pnpm install
pnpm release:vfm       # or release:nuxt / release:codemod
```

`release-it` prompts for the version — choose a prerelease (`5.0.0-rc.1`) for QA, then re-run for each subsequent candidate. It pushes the commit and tag; the workflow publishes to `next`.

> **The very first release is a special case.** The version numbers (`5.0.0`, `2.0.0`, `1.0.0`) and their changelog entries are already written by hand, and the repository has no tags yet. `release-it` bumps from whatever is in `package.json`, so it would propose `5.0.1` and tag a version that does not match the changelog. Pass `--no-increment` so it tags the version already on disk:
>
> ```bash
> pnpm release:vfm -- --no-increment
> ```
>
> The release workflow fails the build if the tag and `package.json` disagree, so a mismatch is caught before anything reaches npm. Subsequent releases bump normally.

When UAT passes, run it once more and choose the final version (`5.0.0`). That tag publishes to `latest`. Then:

```bash
git checkout master && git merge --no-ff release/5.0.0 && git push
git checkout develop && git merge --no-ff release/5.0.0 && git push
```

If you would rather promote the exact artifact that passed UAT instead of publishing a new version, retag the existing one instead of cutting `5.0.0`:

```bash
npm dist-tag add @lrochefort/vue-final-modal@5.0.0-rc.2 latest
```

That avoids a rebuild, at the cost of leaving `-rc.2` as the version consumers see.

## Verifying a release

```bash
npm view @lrochefort/vue-final-modal@<version>

# install into an empty directory and confirm the entry points resolve
mkdir /tmp/vfm-check && cd /tmp/vfm-check && npm init -y
npm install @lrochefort/vue-final-modal@<version>
node -e "console.log(require.resolve('@lrochefort/vue-final-modal'))"
```

Check that the npm page shows the provenance badge, and that the Nuxt module's `@lrochefort/vue-final-modal` dependency is a real semver range rather than `workspace:^`.

## Notes

- The workflow publishes with `pnpm publish`, not `npm publish`. Only pnpm rewrites the `workspace:^` protocol into a real semver range when packing, so `npm publish` would produce a broken tarball.
- `--no-git-checks` is required because tag builds run on a detached HEAD.
- The `--tag` value is derived from the version, not passed by hand. npm defaults to `latest` even for prerelease versions, so publishing `5.0.0-rc.1` without an explicit dist-tag would hand a release candidate to every consumer.
- All three packages set `publishConfig.access: "public"`; scoped packages are private by default.
- pnpm enforces a 24-hour `minimumReleaseAge` on lockfile entries by default. If `pnpm install --frozen-lockfile` fails with `ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION`, a dependency was published very recently — wait for it to age out rather than relaxing the policy.
