# dsh-github-sync

*[English](README.md)*

把DeepSeek Harness（DSH）的会话同步到**私有GitHub仓库**；想让工作区文件也一起走，也可以。一台机器上开头的任务，换一台接着干。

DSH本地版没有云端。这个插件用你已有的仓库补上：没有服务器，不用注册账号，中间不过第三方——会话文件进你的仓库，另一台机器从仓库里读。

![面板：左边远端仓库，右边本地会话，每行带同步徽标](docs/panel.png)

## 它做什么

- **会话上传。** 勾选会话，预览清单，提交。会话文件、它引用的附件、更新后的索引，合成一个提交。
- **会话下载。** 到另一台机器上，文件恢复原样，文件头里的`cwd`按那台机器改写，会话挂到你选的工作区。其余每帧字节不变。
- **附件跟着走。** 会话引用的图片和PDF随它一起上传，按sha256存放。
- **文件和文件夹，默认关闭。** 想让工作区文件也进仓库，在设置里打开。
- **三个agent工具。** 说「把这条会话推到GitHub」，它先出清单；你没确认，它一个字不写。

同步靠手动。没有后台上传，也没有定时器决定什么离开你的机器。

## 工作原理

![本机、私有仓库、另一台机器](docs/flow.png)

会话在磁盘上是一个文件（`session.v4.jsonl.zstd`），不需要服务器：

1. **上传**读会话、它的附件和远端索引，然后写一个提交。
2. **下载**拉文件，改写头帧里的`cwd`，再把会话注册到工作区服务。
3. **多台机器**写之前先合并远端索引，一台设备不会悄悄抹掉另一台的记录。

文件格式、只改头帧、正文前缀比对的理由，见[工作原理](docs/how-it-works_zh.md)。

## 安装

**从插件市场装。** 搜`dsh-github-sync`，安装，启用。

**从本地检出装。** 插件管理器指向这个文件夹，或者用`link:`依赖把包加进profile的`dsh.profile.bundles`。

npm源慢？`npm install dsh-github-sync --registry=https://registry.npmmirror.com`——镜像比发版慢几分钟到几小时。

面板改动后按F5；宿主改动后重载插件。

## 配置

1. 建一个**空的私有**GitHub仓库——不要README，不要`.gitignore`。
2. 建一个**细粒度个人访问令牌**，只授权这个仓库：Contents*读写*、Metadata*只读*。
3. 在DSH侧边栏打开**GitHub 同步**，粘贴`owner/repo`和令牌，点**测试连接**。

令牌存进DSH自己的凭据库（`$DSH_HOME/.credentials.yaml`），面板从不回显。公开仓库一律拒绝。

带截图和错误对照表的逐步说明，见[配置](docs/setup_zh.md)。

## 使用

面板列出这个工作区的会话，每行带同步徽标——`synced`、`local-ahead`、`remote-ahead`、`not-uploaded`、`active`——另有一列是远端仓库。搜索、「只看未同步」、全选、大传输的单文件进度，用得着的时候都在。

日常操作、冲突、删除、仓库变大，看[用法](docs/usage_zh.md)。界面不显示、会话不见了、连接失败，看[排障](docs/troubleshooting_zh.md)。

## 安全

插件只写四个地方，别处不碰：`$DSH_HOME/github-sync/`、`$DSH_HOME/sessions/`、`$DSH_HOME/attachments/v1/objects/`，还有——只有你打开开关时——当前工作区。它不起进程、不执行命令，除了`api.github.com`和`github.com`，哪儿都不连。疑似密钥的文件（`.env*`、`*.key`、`*.pem`、`id_rsa`、`.npmrc`、`.netrc`）再确认一次也拒绝。

`tools/audit-safety.mjs`静态检查这些约束，推送前清单会跑一遍。

## 文档

| 文档 | 内容 |
|---|---|
| [配置](docs/setup_zh.md) | 截图、令牌轮换、首次传输逐步说明 |
| [用法](docs/usage_zh.md) | 面板、徽标、冲突、删除、仓库变大、agent工具 |
| [工作原理](docs/how-it-works_zh.md) | 仓库结构、文件格式、设计取舍、安全边界 |
| [排障](docs/troubleshooting_zh.md) | 症状、原因、已知限制 |
| [开发](docs/development.md) | 代码结构、改动纪律、验证阶梯 |
| [发布](docs/releasing_zh.md) | 版本号、双平台检查、发布 |

## 许可

MIT，见[LICENSE](LICENSE)。
