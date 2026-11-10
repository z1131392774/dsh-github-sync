# 配置

*[English](setup.md)*

刚装好到同步能跑，中间隔三样：一个空私有仓、一枚 fine-grained 令牌、一个两者都填进去的面板。约五分钟，全程不用命令行。

> 令牌等于密码。它存在 `$DSH_HOME/.credentials.yaml`，面板从不回显；聊天、截图、issue，哪儿都别放它。

## 为什么必须是私有仓

插件上传的是完整对话——你问过的代码、贴过的报错、走过的弯路。公开仓把这一切全部公开，搜索引擎还会收录。

插件在这件事上没有商量：仓库不私有，连接测试直接失败，一次传输都不会发生。

## 建仓库

1. 打开 <https://github.com/new>。
2. 名字随便起，例如 `dsh-sync`；插件拿它当项目名前缀。
3. **Visibility** 选 **Private**。
4. README、`.gitignore`、license 三项都不勾。有提交的仓库也能用，空仓库却能走一遍零提交的路径，还省掉首次上传的那次合并。
5. 点创建。

## 建令牌

1. 打开 <https://github.com/settings/tokens?type=beta>，选 **Generate new token**。
2. 名字填 `dsh-github-sync`；有效期设一个你记得住的，90 天或一年。
3. **Repository access** 下选 **Only select repositories**，勾上上面那个仓库。打算同步的仓库，一个个都勾上。
4. **Repository permissions** 下，把 **Contents** 设成 **Read and write**。**Metadata** 自己会变成只读。
5. 生成，立刻复制那串 `github_pat_…`。

令牌只显示一次；fine-grained 令牌建好后没法扩权限——仓库选错了只能新建一枚，改不了。

带 `repo` 范围的 classic 令牌也能用，但更糟：你够得着的仓库，它全都能碰。

## 填面板

1. 打开 DSH，点侧栏的 **GitHub 同步**。
2. 打开设置（右上角 ⚙）。
3. 仓库填 `owner/repo`、`https://github.com/owner/repo` 或 `https://github.com/owner/repo.git`，三种写法都认。
4. 分支保持 `main`，除非你有理由改。
5. 粘贴令牌，保存，再点 **测试连接**。

绿点亮着、显示“已连接”，面板就能用了；本地每条会话右侧都会出现同步徽标。

## 第二台机器

同一个仓库能带任意台机器；新机器不用另建仓库，严格说也不用另发令牌。

1. 装好插件。
2. 把上面填面板那步再做一遍，**仓库填同一个**。
3. 可以的话**每台机器一枚令牌**——吊销一台，不牵连别的。
4. 点刷新：远端列里会列出已经传上去的东西。
5. 勾一条会话，下载，确认。它挂到你选的工作区，从停下的地方接着聊。

多台机器自动合并：每次写入前都重读远端索引，跟自己的计划求并集，谁后提交都盖不掉别人的记录。两端改过同一条会话时，预览标 `blocked`，问你选哪边。

## 证书错误

报 `fetch failed (UNABLE_TO_VERIFY_LEAF_SIGNATURE)`、`SELF_SIGNED_CERT_IN_CHAIN` 或 `unable to get local issuer certificate`，说明机器上有软件在解密 HTTPS，并掏出自己的根证书。浏览器认它，因为系统信它；Node 只信内置那份清单。

头号嫌疑：SteamTools / Watt Toolkit（签发者 `CN=SteamTools Certificate, O=BeyondDimension`）、开着 HTTPS 解密的 Fiddler 或 Charles、带网页防护的安全软件。

**绕开拦截。**

在那个工具的绕过或跳过列表里加上：

```
api.github.com
github.com
*.githubusercontent.com
```

**关掉解密。** SteamTools：关掉 GitHub 加速。抓包工具：停止捕获，或关掉 HTTPS 解密。安全软件：关掉 HTTPS 扫描。

**显式信任那张证书**，前提是它是你上 GitHub 的唯一路子。导出它的根证书，让 Node 指过去：

```powershell
$cert = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root |
  Where-Object { $_.Subject -match 'SteamTools' } | Select-Object -First 1
$pem = "-----BEGIN CERTIFICATE-----`n" +
  [Convert]::ToBase64String($cert.RawData, [Base64FormattingOptions]::InsertLineBreaks) +
  "`n-----END CERTIFICATE-----`n"
Set-Content -Path "$env:USERPROFILE\.dsh\proxy-ca.pem" -Value $pem -Encoding ascii
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', "$env:USERPROFILE\.dsh\proxy-ca.pem", 'User')
```

彻底退出 DSH 再打开；环境变量只够得着新进程。这么做等于把 Node 的 HTTPS 流量交给那张证书的主人读——它本来就在读你浏览器的流量，这份信任不算新增，但软件卸了记得撤掉：

```powershell
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', $null, 'User')
```

## 轮换令牌

1. 给同一个仓库建一枚新令牌，权限照旧。
2. 贴进面板，保存，测试。
3. 到 <https://github.com/settings/tokens> 删掉旧令牌。

令牌泄露了，先删再补。GitHub 记着每枚令牌最近一次使用的时间，能用它判断有没有人动过。

## 配置时的常见错误

| 现象 | 原因 | 处理 |
|---|---|---|
| `404 Not Found` | 名字写错、令牌没授权它，或仓库不存在 | 查令牌的 **Repository access** |
| `401 Unauthorized` | 过期、已吊销，或复制时漏了字符 | 重新生成再粘贴 |
| `403` / `Resource not accessible` | 缺 **Contents: Read and write** | 建一枚带该权限的新令牌 |
| "This repository is public" | 可见性是公开 | Settings → Change visibility → private |
| "The token is corrupted" | 存进去的不是令牌 | 再粘贴一次令牌 |
| "Failed to seed the empty repository" | Contents API 播种失败 | 在 GitHub 上建一个 README，再重试 |
| 列出 0 条会话 | 该工作区没有会话，或目录 key 没解析出来 | 换工作区；仍为空就打开 **诊断 → 复制**，读 `平台:` 和 `会话目录(应有):` 两行 |

## 这里到底写了什么

| 路径 | 内容 |
|---|---|
| `$DSH_HOME/github-sync/` | 插件状态、历史、诊断 |
| `$DSH_HOME/sessions/` | 你下载或删除的会话 |
| `$DSH_HOME/attachments/v1/objects/` | 你还原或回收的附件 |

令牌在 `$DSH_HOME/.credentials.yaml` 里，由 DSH 管理。工作区只有开了文件同步才会碰，这些路径之外什么都不读不写。
