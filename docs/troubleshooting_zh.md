# 排障

*[English](troubleshooting.md)*

## 插件

| 症状 | 原因和修复 |
|---|---|
| 测试连接时报`fetch failed`| 宿主连不上`api.github.com`。先查代理：Node无视`HTTPS_PROXY`，除非设了`NODE_USE_ENV_PROXY=1`；DSH启动时读这个环境（或`$DSH_HOME/.env`）。 |
|`UNABLE_TO_VERIFY_LEAF_SIGNATURE`、`SELF_SIGNED_CERT_IN_CHAIN`| 机器上有软件在解密HTTPS。见[证书错误](setup_zh.md)。 |
|`Git Repository is empty`（409） | 仓库零提交。首次提交靠Contents API打底；一直失败就在GitHub上建个README再试。 |
|`404 Not Found`| 仓库名写错了，或者令牌没授权到这个仓库。 |
|`401 Unauthorized`| 令牌过期、已撤销，或者粘贴时截断。 |
|`403`/`Resource not accessible`| 令牌缺Contents的读写权限。 |
| "This repository is public" | 把可见性改成私有。这个拒绝是故意的。 |
| "The token is corrupted" | 粘进来的不是令牌，重新粘一遍。 |
| 预览里`blocked`行一大堆 | 文件撞了密钥规则，或者超过大小上限；每行都有说明。 |
| 会话下载了，侧边栏不显示 | 宿主缓存了会话头。重启DSH，或者重新打开工作区。 |
| 同一台机器：删了再下载，报`its cwd resolves to …`| 运行中的宿主还记着旧文件头，重启DSH。从另一台机器真交接没这问题，那边的宿主从没见过这个id。 |
| 列出0条会话，可工作区里有 | 那个平台的会话目录键对不上，兜底扫描也漏了。打开**诊断 → 复制**，把`平台:`、`会话目录(应有):`、`sessions 根下 N 个目录:`三行发出来。 |
| macOS列不出东西 | 同一个键不匹配的问题，Windows不触发。诊断会把算出来的名字和真实名字并排显示。 |
| 下载落错工作区 | 去处由左栏的**下载到**下拉框定，按机器记住。改那里；想让它跟着你走，先把期望的文件夹在左边打开。 |
|`blocked`：会话已属于另一个工作区 | 一条会话归一个工作区。下载到它挂着的那个工作区，或者先在那儿解除关联。按设计，强制不了这条。 |
| 下载的结果是分叉 | 两边都改过这条会话。远端副本另存在本地文件旁边，名字是`*.remote-fork-<stamp>`；哪边对心里有数，就强制哪边。 |
| 大会话上传慢或超时 | 瓶颈在到`api.github.com`的链路。让DSH走代理，设`NODE_USE_ENV_PROXY=1`；2.5MB的会话从两分钟变成几秒。 |
| 交接后报`Attachment object is missing`| 会话引用的附件对象不在这台机器上。把`$DSH_HOME/attachments/v1/objects/<sha[0:2]>/<sha>`拷过来，或者删掉引用它的那条消息。 |

## 已知限制

- **附件按引用上传。** 只传会话点到的附件；没人引用的孤儿附件不上传，也不占地方。
- **超过25MB的单个附件跳过**，在预览里标出来，不让整批失败。
- **本地缺附件不挡上传**，但预览用 ⚠ 标出。
- **只改写`version: 4`的会话。** 其他版本直接拒绝，不猜。
- **文件下载写进工作区根目录**，同名时另存一份。没有三方合并。
- **两边删除都不可恢复。** 没有回收站；远端删掉的会话只活在git历史里。
- **同步靠手动。** 没有定时上传，一轮对话结束也不上传。

## 状态放在哪儿

| 路径 | 内容 |
|---|---|
|`$DSH_HOME/github-sync/state.json`| 仓库、分支、设备id、选项 |
|`$DSH_HOME/github-sync/history.jsonl`| 最近的传输 |
|`$DSH_HOME/.credentials.yaml`| 令牌，引用名`GITHUB_TOKEN`|

卸了插件，这三个文件还在；想忘掉配置，删掉它们。
