---
name: pre-push-checks
description: Use before pushing, opening a pull request, or claiming a change is verified, to select the smallest checks that cover the outgoing diff instead of rerunning the whole suite.
---

# 推送前检查

*[English](SKILL.md)*

把覆盖这次 diff 的检查跑一遍，就这些；剩下的交给 CI。

下面的对照看不清、某个检查挂了要判断它在不在范围内、或者改动跨了一道你没预料到的边界——打开 [references/check-selection.md](references/check-selection.md)。

## 1. 弄清要推走什么

```sh
git status --short --branch
git diff --stat <base>...HEAD
```

已暂存、未暂存、已提交而 base 还没有的，都算。从半个 diff 里挑出来的检查，对剩下那半什么都没说。

## 2. 把改动的路径对上检查

| 改动的路径 | 检查 |
| --- | --- |
| 任何 `*.md`、`AGENTS.md`、`.agents/**` | `npm run check` |
| `lib/sessionlog.mjs`、`lib/zstdframe.mjs`、`lib/manifest.mjs` | 先 `node tools/selftest.mjs`，再 `node tools/test-upload-plan.mjs` |
| `lib/guard.mjs`，或任何把远端给的 id、sha 拼进路径的代码 | `node tools/test-guards.mjs` |
| `lib/folders.mjs`，或文件/文件夹同步 | 先 `node tools/test-filesync.mjs`，再 `node tools/test-boundaries.mjs` |
| `lib/github.mjs`（blobs、trees、refs、重试） | 先 `node tools/test-multidevice.mjs`，再对测试仓库跑 `node tools/e2e.mjs` |
| `lib/projectkey.mjs`、`lib/sessiondir.mjs` | `node tools/test-crossplatform.mjs` |
| `index.js` 路由或 `client.js` 面板 | 对测试仓库跑 `node tools/e2e.mjs`，再手动过一遍你动过的那两条路径 |
| `package.json` 的 `files`、`exports`、`dsh`、`engines` | `pnpm pack`，查看包内文件；然后在插件管理器里停用再启用，确认不出现 `incompatible-version` |
| `tools/*.mjs` 本身 | `npm test` 的全套——坏掉的测试是坏掉的信号 |
| 什么都没改 | 不跑检查。直说，别编一个。 |

`tools/e2e.mjs` 要一个在跑的 DSH 和一个**专用的测试仓库**；`--write` 真的会上传和删除。传 `SYNC_BASE=http://127.0.0.1:<port>`：插件的端口重启后会变。

## 3. 每项检查跑一遍，记下结果

报告准确的命令和它的返回。「应该能过」不是证据，照上个版本抄的测试数也不是。

## 4. 停止规则

- 检查挂了就挡住推送。修好它，或者报告输出，并且别说这次改动已验证。
- 在这里跑不了的检查，带上原因报告。别悄无声息地换成一个更弱的。
- 检查通过了，别因为「感觉没跑全」就重跑。diff 没变，结果作数。
- 别对存有真实会话的仓库跑 `e2e --write`。

## 5. 交棒

说清跑了哪些检查、结果如何，以及你决定不跑什么。评审不该替你重建证据。
