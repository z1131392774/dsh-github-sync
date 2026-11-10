# dsh-github-sync

Sync your DeepSeek Harness (DSH) sessions — and, if you want, workspace files — to a **private GitHub repository**, so a task you started on one machine continues on another.

*[中文文档](README_zh.md)*

Local DSH has no cloud. This plugin gives it one, using a repository you already own. There is no server, no account, and no third party in between: your session files go into your repo, and another machine reads them from there.

![The panel: remote repository on the left, local sessions on the right, sync badges on every row](docs/panel.png)

## What it does

- **Sessions up.** Pick conversations, preview the list, commit. The session file, the attachments it references, and an updated index land as one commit.
- **Sessions down.** On the other machine the file is restored, the `cwd` inside its header is rewritten for that machine, and the session attaches to the workspace you choose. Every other frame stays byte-identical.
- **Attachments travel.** Images and PDFs referenced by a session go up with it, stored by sha256.
- **Files and folders, off by default.** Turn them on in settings if you also want workspace files in the repo.
- **Three agent tools.** "Push this session to GitHub" produces a checklist first; nothing is written until you confirm.

Synchronising is manual. Nothing uploads in the background, and no timer decides what leaves your machine.

## How it works

![This machine, the private repository, another machine](docs/flow.png)

A session on disk is a file (`session.v4.jsonl.zstd`), so no server is involved:

1. **Upload** reads the session, its attachments, and the remote index, then writes one commit.
2. **Download** fetches the file, rewrites the `cwd` in the header frame, and registers the session with the workspace service.
3. **Several machines** merge the remote index before writing, so one device never silently erases another's records.

The reasoning behind the file format, the header-only rewrite, and the body-prefix comparison is in [How it works](docs/how-it-works.md).

## Install

**From the plugin market.** Search `dsh-github-sync`, install, enable.

**From a local checkout.** Point the plugin manager at this folder, or add the package to your profile's `dsh.profile.bundles` with a `link:` dependency.

A slow npm registry? `npm install dsh-github-sync --registry=https://registry.npmmirror.com` — mirrors lag a few minutes to a few hours behind a release.

After a panel change, press F5. After a host change, reload the plugin.

## Configure

1. Create an **empty private** GitHub repository — no README, no `.gitignore`.
2. Create a **fine-grained personal access token** limited to that repository: Contents *Read and write*, Metadata *Read-only*.
3. Open **GitHub Sync** in the DSH sidebar, paste `owner/repo` and the token, and press **Test connection**.

The token goes into DSH's own credential store (`$DSH_HOME/.credentials.yaml`) and is never echoed back to the panel. The plugin refuses public repositories outright.

A walk-through with screenshots and the error table lives in [Setup](docs/setup.md).

## Use

The panel lists this workspace's sessions with a sync badge — `synced`, `local-ahead`, `remote-ahead`, `not-uploaded`, `active` — plus a remote column for the repository. Search, "only unsynced", select-all, and per-file progress for large transfers are there when you need them.

Day-to-day operations, conflicts, deletion, and repository growth: [Usage](docs/usage.md). Nothing renders, sessions vanish, or the connection fails: [Troubleshooting](docs/troubleshooting.md).

## Safety

The plugin writes to four places and nowhere else: `$DSH_HOME/github-sync/`, `$DSH_HOME/sessions/`, `$DSH_HOME/attachments/v1/objects/`, and — only when you enable it — the current workspace. It starts no processes, runs no commands, and talks to nothing except `api.github.com` and `github.com`. Secret-shaped files (`.env*`, `*.key`, `*.pem`, `id_rsa`, `.npmrc`, `.netrc`) are refused even after a second confirmation.

`tools/audit-safety.mjs` checks those invariants statically, and the pre-push checklist runs it.

## Documentation

| Document | Contents |
|---|---|
| [Setup](docs/setup.md) | Screenshots, token rotation, first-transfer walk-through |
| [Usage](docs/usage.md) | Panel, badges, conflicts, deletion, repository growth, agent tools |
| [How it works](docs/how-it-works.md) | Repository layout, file format, design decisions, safety boundary |
| [Troubleshooting](docs/troubleshooting.md) | Symptoms, causes, known limitations |
| [Development](docs/development.md) | Code layout, change discipline, verification ladder |
| [Releasing](docs/releasing.md) | Version bump, dual-platform check, publish |

## License

MIT — see [LICENSE](LICENSE).
