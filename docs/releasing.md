# Releasing

*[中文](releasing_zh.md)*

A checklist for a version that reaches the plugin market and npm without embarrassing itself. Run it top to bottom; each step assumes the previous one passed.

## Metadata

`package.json` carries `name`, `version`, `description`, `license`, `author`, `repository`, `homepage`, `bugs`, `keywords`, `engines`, `files`, `exports`, and `dsh`. The repository fields point at the repository that will actually serve the published package — a fork that publishes must say so, or issue reports land in someone else's tracker.

`private` must be absent for a public release.

## engines.dsh must name the prerelease

The runtime is a prerelease (`0.2.1-rc.5`). By semver, `>=0.2.1` **does not** include `0.2.1-rc.5`, and the mismatch surfaces as an install failure:

```
incompatible-version: dsh-github-sync 0.5.0
requirements {"engines.dsh": ">=0.2.1"}  runtimeVersion "0.2.1-rc.5"
```

`"dsh": ">=0.2.1-rc.5"` is the form that passes. The quickest confirmation is to disable and re-enable the plugin in the manager: `incompatible-version` means it did not pass.

## Package and inspect

```bash
pnpm pack
tar -tzf dsh-github-sync-<version>.tgz
```

`files` should ship exactly what the runtime needs: `index.js`, `client.js`, `cordis.patch.yml`, `icon.svg`, `locale/*.json`, `lib/*.mjs`, plus `README.md`, `README_zh.md`, `CHANGELOG.md`, `LICENSE`, and the `docs/` pages the README links to. `tools/`, `docs/*.png` used only by the README of the repository, and `node_modules` stay out — but a README that links to a file the archive does not contain is worse than a longer archive.

## Single-platform check

The plugin is plain JavaScript with no native modules, so Windows and macOS run the same code. What needs a human is path behaviour, and each machine can verify it alone.

Prepare: one machine, DSH at or above the engine floor, and an **empty private test repository** — never the real one.

| # | Action | Expected |
|---|---|---|
| 1 | Install, enable, open **GitHub Sync** | Panel opens, sidebar icon present |
| 2 | Check the version shown in the panel header | Matches `package.json` |
| 3 | Repository and token, then **Test connection** | Connected, no 404/401 |
| 4 | Look at the local column | Non-empty, every row has a badge |
| 5 | Tick a session, preview upload, confirm | Progress bar shows `x/y files · KB/KB · KB/s` |
| 6 | Read the result line | `Committed N sessions · <7-char sha>` |
| 7 | Wait two seconds, re-read the row | Badge is synced; the remote column lists the session, `manifest.json`, and `README.md` |
| 8 | Add an empty directory as a workspace and switch to it | Local column reports no sessions |
| 9 | Tick the same session remotely, download, confirm | Written and attached; switching back shows it |
| 10 | Local trash, twice | Deleted locally; **still in the repository** |
| 11 | Remote trash, twice | Removed from the repository; **still local**, badge not-uploaded |
| 12 | **Diagnostics → Copy** | Writable scope lists three `.dsh` paths and says file sync is off |

Step 4 is the one that catches platform bugs: an empty list means the directory key does not match and the fallback missed. Send the directory names under `sessions/` and fix `lib/projectkey.mjs` against the real format.

| Check | Windows | macOS |
|---|---|---|
| Sessions live in | `%USERPROFILE%\.dsh\sessions\` | `~/.dsh/sessions/` |
| Directory name looks like | `--E-projects-work--` | `--Users-name-work--` |

## Two-machine check

Needed only when hand-over itself changed. Two machines, one repository, one long-lived session.

| # | Action | Expected |
|---|---|---|
| 1 | A uploads a session | Written |
| 2 | B refreshes | The session appears remotely |
| 3 | B downloads and confirms | Attached, and it continues |
| 4 | B sends another message in it | Badge turns local-ahead |
| 5 | B uploads; A refreshes | A shows remote-ahead, and downloading brings B's message |
| 6 | Both open **Devices** | Two device names, each marking itself |
| 7 | Both open **History** | Both commits visible |

Step 5 exercises the whole chain at once: header remapping, body comparison, and index merge.

## Safety audit and tests

```bash
node tools/audit-safety.mjs        # 19 invariants
node tools/selftest.mjs            # codec, remap, manifest (offline)
node tools/test-upload-plan.mjs    # upload planning (offline)
node tools/test-force.mjs          # forced conflict resolution (offline)
node tools/test-multidevice.mjs    # index merge, non-fast-forward retry (offline)
node tools/test-crossplatform.mjs  # session directory fallback (offline)
node tools/test-guards.mjs         # hostile ids and shas are rejected (offline)
node tools/test-filesync.mjs       # secret blocking, limits, path cleaning (offline)
node tools/test-boundaries.mjs     # size edges, empty files, long and CJK names (offline)
node tools/e2e.mjs                 # end-to-end, read-only (needs a running DSH)
npm run check                      # documentation gate
```

`tools/e2e.mjs --write` really uploads and deletes; run it only against the test repository, and pass `SYNC_BASE=http://127.0.0.1:<port>` because the plugin's port changes on every restart.

## Version consistency

Three places must agree before a release: `package.json` `version`, `VERSION` in `index.js`, and `VERSION` in `client.js`. `CHANGELOG.md` needs an entry under the same number, written for someone deciding whether to upgrade.

## npm and the China mirror

npmmirror is a read-only mirror of `registry.npmjs.org`; nothing is published to it. The order is fixed: publish to npm, the mirror copies it, users in China install from the mirror.

```bash
npm publish --access public
node tools/publish-cn.mjs --wait
```

`publish-cn.mjs` checks npm for the version, triggers a mirror sync, and polls until the mirror serves it. Behind a slow link, set `HTTPS_PROXY` and `NODE_USE_ENV_PROXY=1` first. To fall back to the web UI, open <https://npmmirror.com/package/dsh-github-sync> and press sync.

```bash
npm view dsh-github-sync version --registry=https://registry.npmmirror.com
```

A version number instead of `404` means the mirror is ready. A new release lags the mirror by minutes; that is normal and not a reason to re-publish.

Install instruction to publish alongside:

```bash
npm install dsh-github-sync --registry=https://registry.npmmirror.com
```

## Plugin market

The market (dshmarket) reads its catalogue from [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin), so listing means a pull request there, not an upload to a backend. It requires `dsh.bundle` in `package.json` and a `dsh-plugin` topic on the repository.
