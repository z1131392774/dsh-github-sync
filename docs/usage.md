# Usage

*[中文](usage_zh.md)*

The panel is the whole interface. Each side has exactly one action — the left pane downloads, the right pane uploads — so a click never needs a second thought about which direction it goes. Everything that writes to GitHub goes through a preview you confirm.

## The panel

![The panel](panel.png)

```
┌ device / repository / branch ────────────────── ● connected   [refresh] [gear] ┐
├────────────────────────────────┬─────────────────────────────────────────────┤
│ REMOTE (repository)            │ LOCAL (this machine)                        │
│ download to: [workspace  ▾]    │ browse: [workspace  ▾]                      │
│ 💬 sessions (tickable)         │ ☑ session…   synced  size  time             │
│ 📄 files (tickable)            │                                             │
│ [Folder…] [Download files]     │ [Sync this workspace (3)]                   │
│ [Download to this machine (2)] │ [Upload to repository (2)]                  │
└────────────────────────────────┴─────────────────────────────────────────────┘
```

Two dropdowns, two jobs. **browse** only decides which sessions the local list shows; it never decides where a download lands. **download to** is the destination for the sessions you tick on the left, it is remembered between visits, and the confirmation dialog repeats it before anything is written.

Below 820 pixels wide the two panes collapse into one, with a switch that stays pinned at the top (`本机 · 12` / `仓库 · 40`). The panel then scrolls as a single page: no inner list has its own scrollbar, so the whole view moves under your thumb. Every row keeps its full width, rows grow to finger height, and the pane's action bar sticks to the bottom of the screen while its list scrolls past.

## Sync badges

Each local row carries a badge derived by comparing the body hashes of the local file and the remote index.

| Badge | Meaning |
|---|---|
| Synced | Both sides hold the same bytes |
| Local ahead | You kept talking here; upload it |
| Remote ahead | Another machine pushed; download it |
| Not uploaded | Never sent |
| Active | Written to in the last five minutes; an upload is a snapshot of a moving file |

Search, **only unsynced**, **select unsynced**, and **sync this workspace (N)** exist so that "what has not gone up" never has to come from memory.

## Transfers

Long transfers show file-level progress — `12/30 · uploading · f12.bin` — covering both the preview (reading sessions, listing the remote tree) and the commit (blob upload, tree, commit).

- Click `▸` beside the bar to expand the file list: each entry reads queued, transferring, done, or skipped.
- Any file that has not started can be **skipped**. Skipping an attachment also drops its reference from `manifest.json`, so no dangling record is left behind.
- **Cancel** takes effect between files. The ref is never updated, so a half-finished transfer leaves no commit in the repository.
- Transfer state lives in the host process, not in the browser: navigate away and come back, and the bar reattaches. An unconfirmed preview is restored too.
- Panel state — selected workspace, ticks, toggles — persists in the browser across reloads.

## Devices and history

**Devices** lists every machine recorded in the remote index with its last activity; this machine is marked. **History** is the recent upload and download log (file counts, commit, failures), appended to `$DSH_HOME/github-sync/history.jsonl`.

## Deleting

The two sides are independent, and each delete asks twice within four seconds.

- **Trash on a local row** deletes this machine's session only; the repository keeps it. Attachments nothing else references are collected locally.
- **Trash on a remote row** deletes it from the repository only; this machine keeps it. Attachments nothing else references are collected remotely.

## Conflicts

When both sides changed the same session, the preview marks the row `blocked` and offers a decision:

| Choice | Effect |
|---|---|
| Download first | Pull the remote copy, then decide |
| Force local over remote | Take this machine's version |
| Force remote over local | Take the repository's version |

Both force actions apply immediately and re-run the preview, so the list always shows what would happen next rather than what happened before.

A session belongs to one workspace. If you point a download at a second workspace, the plan refuses with `blocked` even under force — detach it there first, or download into the workspace whose header `cwd` already matches.

## Repository growth

Every upload writes a new blob; GitHub never reclaims the old one on its own. A session sits at a fixed path (`<project>/sessions/<id>.jsonl.zstd`), so history costs space without breaking anything.

- To reclaim it: `git clone --mirror`, rewrite with `git filter-repo`, or start a fresh repository and upload again.
- One repository per project ages better than one for everything when the goal is hand-over rather than archive.
- **Diagnostics** reports the current remote session and attachment counts if you want to size the problem first.

## First run

With no repository configured, a banner offers **Start setup**: create an empty private repository, create a fine-grained token, paste both, test. Each step links to the GitHub page it needs. See [Setup](setup.md).

## Asking the agent

The plugin registers three tools, so you can work in sentences:

- "Push this session to GitHub" — `github_sync_transfer` with `phase: preview` returns the plan; the same tool with `phase: execute` and the preview token performs it.
- "What is in the remote repository?" — `github_sync_remote_list`.
- "Is the connection still good?" — `github_sync_status`.

The agent cannot skip the preview: the token is issued by the host, and execute fails without it.
