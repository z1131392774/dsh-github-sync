# 发布

*[English](releasing.md)*

一份清单，让一个版本体体面面地到插件市场和 npm 上。从上往下走，每一步都假定前一步过了。

## 元数据

`package.json` 里有 `name`、`version`、`description`、`license`、`author`、`repository`、`homepage`、`bugs`、`keywords`、`engines`、`files`、`exports` 和 `dsh`。repository 那几个字段要指向真正托存这个包的仓库——fork 之后要发布，就得照实写，不然 issue 落到别人的 tracker 里。

公开发布时 `private` 不能留。

## engines.dsh 必须带预发布标记

运行时是预发布版（`0.2.1-rc.5`）。按语义化版本，`>=0.2.1` **不**含 `0.2.1-rc.5`，写法不匹配就装不上：

```
incompatible-version: dsh-github-sync 0.5.0
requirements {"engines.dsh": ">=0.2.1"}  runtimeVersion "0.2.1-rc.5"
```

过得去的写法是 `"dsh": ">=0.2.1-rc.5"`。最快的验证：在插件管理器里关掉再启用一次；报 `incompatible-version` 就是没过。

## 打包与检查

```bash
pnpm pack
tar -tzf dsh-github-sync-<version>.tgz
```

`files` 只发运行时真要的东西：`index.js`、`client.js`、`cordis.patch.yml`、`icon.svg`、`locale/*.json`、`lib/*.mjs`，外加 `README.md`、`README_zh.md`、`CHANGELOG.md`、`LICENSE`，以及 README 链到的那些 `docs/` 页面。`tools/`、只有仓库 README 才用的 `docs/*.png`、`node_modules` 都不进包——可 README 链了包里没有的文件，比包大一点更糟。

## 单平台自检

插件是纯 JavaScript，没有原生模块，Windows 和 macOS 跑同一份代码。要人确认的只有路径行为，每台机器自己就能验。

准备：一台机器、DSH 版本不低于引擎版本下限、一个**空的私有测试仓**——千万别用真仓。

| # | 操作 | 期望 |
|---|---|---|
| 1 | 安装、启用，打开 **GitHub 同步** | 面板打开，侧栏图标在 |
| 2 | 看面板头部显示的版本 | 与 `package.json` 一致 |
| 3 | 填仓库和令牌，点 **测试连接** | 已连接，没有 404/401 |
| 4 | 看本地列 | 非空，每行都有徽标 |
| 5 | 勾一条会话，预览上传，确认 | 进度条显示 `x/y files · KB/KB · KB/s` |
| 6 | 读结果行 | `Committed N sessions · <7-char sha>` |
| 7 | 等两秒，重读该行 | 徽标是已同步；远端列出现该会话、`manifest.json` 和 `README.md` |
| 8 | 建一个空目录当工作区，切过去 | 本地列报告没有会话 |
| 9 | 在远端勾同一条会话，下载，确认 | 已写入并挂载；切回去能看到它 |
| 10 | 本地删除，点两次 | 本地已删；**仓库里还在** |
| 11 | 远端删除，点两次 | 从仓库移除；**本地还在**，徽标是未上传 |
| 12 | **诊断 → 复制** | 可写范围列着三个 `.dsh` 路径，并说明文件同步已关闭 |

第 4 步最能抓出平台问题：列表为空，说明目录 key 没对上，兜底也没命中。把 `sessions/` 下的目录名发出来，照真实格式修 `lib/projectkey.mjs`。

| 检查点 | Windows | macOS |
|---|---|---|
| 会话目录在哪 | `%USERPROFILE%\.dsh\sessions\` | `~/.dsh/sessions/` |
| 目录名长什么样 | `--E-projects-work--` | `--Users-name-work--` |

## 两端互通

只有接力本身有改动时才需要。两台机器、一个仓库、一条活得够久的会话。

| # | 操作 | 期望 |
|---|---|---|
| 1 | A 上传一条会话 | 写入成功 |
| 2 | B 点刷新 | 远端出现该会话 |
| 3 | B 下载并确认 | 挂载成功，能接着聊 |
| 4 | B 在会话里再发一句话 | 徽标变本地更新 |
| 5 | B 上传；A 刷新 | A 显示远端更新，下载能拿到 B 发的那句话 |
| 6 | 两端都打开 **设备** | 两个设备名，各自标出自己 |
| 7 | 两端都打开 **历史** | 两次提交都看得见 |

第 5 步一次练遍整条链：头部重映射、正文比对、索引合并。

## 安全审计与测试

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

`tools/e2e.mjs --write` 真上传、真删除，只在测试仓上跑；插件的端口每次重启都变，跑之前传 `SYNC_BASE=http://127.0.0.1:<port>`。

## 版本一致性

发布前三处版本号必须一致：`package.json` 的 `version`、`index.js` 的 `VERSION`、`client.js` 的 `VERSION`。`CHANGELOG.md` 要有同号条目，写给正在权衡要不要升级的人看。

## npm 与大陆镜像

npmmirror 是 `registry.npmjs.org` 的只读镜像，没东西发到它上面。顺序是定的：先发 npm，镜像复制，大陆用户从镜像装。

```bash
npm publish --access public
node tools/publish-cn.mjs --wait
```

`publish-cn.mjs` 先查 npm 上有没有这个版本，再触发镜像同步，然后轮询到镜像供上为止。网慢的话，先把 `HTTPS_PROXY` 和 `NODE_USE_ENV_PROXY=1` 设好。要退回网页，打开 <https://npmmirror.com/package/dsh-github-sync>，点 sync。

```bash
npm view dsh-github-sync version --registry=https://registry.npmmirror.com
```

返回版本号而不是 `404`，镜像就绪。新发布后镜像慢几分钟是常态，不值得为此重发。

随发布一起公布的安装命令：

```bash
npm install dsh-github-sync --registry=https://registry.npmmirror.com
```

## 插件市场

市场（dshmarket）的目录读自 [awesome-dsh-plugin](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)，上架意味着去那儿提 pull request，不是往某个后台上传。它要求 `package.json` 里有 `dsh.bundle`，仓库打上 `dsh-plugin` topic。
