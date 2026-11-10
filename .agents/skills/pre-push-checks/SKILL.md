---
name: pre-push-checks
description: Use before pushing, opening a pull request, or claiming a change is verified, to select the smallest checks that cover the outgoing diff instead of rerunning the whole suite.
---

# Pre-push checks

*[中文](SKILL_zh.md)*

Run the checks that cover this diff, once. CI runs everything else.

Open [references/check-selection.md](references/check-selection.md) when the mapping below is unclear, when a check fails and you need to judge whether it is in scope, or when a change crosses a boundary you did not expect.

## 1. Know what is leaving

```sh
git status --short --branch
git diff --stat <base>...HEAD
```

Include staged, unstaged, and committed work the base does not have. A check chosen from a partial diff says nothing about the rest.

## 2. Map changed paths to checks

| Changed paths | Check |
| --- | --- |
| Any `*.md`, `AGENTS.md`, `.agents/**` | `npm run check` |
| `lib/sessionlog.mjs`, `lib/zstdframe.mjs`, `lib/manifest.mjs` | `node tools/selftest.mjs`, then `node tools/test-upload-plan.mjs` |
| `lib/guard.mjs`, or anything joining a remote-supplied id or sha into a path | `node tools/test-guards.mjs` |
| `lib/folders.mjs`, or file/folder sync | `node tools/test-filesync.mjs`, then `node tools/test-boundaries.mjs` |
| `lib/github.mjs` (blobs, trees, refs, retries) | `node tools/test-multidevice.mjs`, then `node tools/e2e.mjs` against the test repository |
| `lib/projectkey.mjs`, `lib/sessiondir.mjs` | `node tools/test-crossplatform.mjs` |
| `index.js` routes or `client.js` panel | `node tools/e2e.mjs` against the test repository, plus a manual pass on the two paths you touched |
| `package.json` `files`, `exports`, `dsh`, `engines` | `pnpm pack` and inspect the archive; then disable and re-enable the plugin in the manager to confirm no `incompatible-version` |
| `tools/*.mjs` themselves | The suite from `npm test` — a broken test is a broken signal |
| Nothing at all | No check. Say so instead of inventing one. |

`tools/e2e.mjs` needs a running DSH and a **dedicated test repository**; `--write` really uploads and deletes. Pass `SYNC_BASE=http://127.0.0.1:<port>`, because the plugin's port changes on restart.

## 3. Run each check once and record the result

Report the exact command and what it returned. "Should pass" is not evidence, and neither is a test count quoted from the previous release.

## 4. Stop rules

- A failing check blocks the push. Fix it, or report the output and do not call the change verified.
- A check that cannot run here is reported with the reason. Never swap it silently for a weaker one.
- Never re-run a passing check because the run "felt incomplete". If the diff did not change, the result stands.
- Never run `e2e --write` against a repository that holds real sessions.

## 5. Hand off

State the checks run, their results, and anything you chose not to run. The reviewer should not have to reconstruct your evidence.
