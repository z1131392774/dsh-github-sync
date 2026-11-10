# How it works

*[中文](how-it-works_zh.md)*

![This machine, the private repository, another machine](flow.png)

A session on disk is one file, so synchronising needs no server: the repository is the transport, and a commit is the unit of transfer.

## The repository

```
README.md                        generated index: projects, sessions, devices
manifest.json                    authoritative index: id → path, original cwd, sha, attachments
<project>/sessions/<id>.jsonl.zstd   the session itself, in DSH's own format
<project>/attachments/<sha>.<ext>    attachments the sessions reference
<project>/files/<relative path>      workspace files, when file sync is on
```

`manifest.json` keeps each session's **original `cwd`**. That is what makes a hand-over possible: on download it becomes the target machine's workspace path, and the session header is rewritten to match.

## The session file

A session is a JSONL stream compressed as **multiple zstd frames**: the first frame holds a header (`cwd` among other fields), and each later batch of records is appended as its own frame. The file is append-only by design.

DSH validates a session by checking that the file's actual path equals the path implied by `header.cwd`. A file that disagrees reads as corrupt.

## Decisions

**Only the header frame is recompressed.** Rewriting `cwd` touches frame one and nothing else. Re-encoding later frames would break the append-only byte chain and make prefix comparison impossible forever after.

**Path is identity, so cwd and directory move together.** The directory name is the encoded `cwd`; changing one without the other produces a session DSH refuses to load.

**Conflict detection compares bodies, not headers.** Header `cwd` legitimately differs per machine, so sync state and divergence are judged on the bytes after the header. If one side is a byte prefix of the other, the shorter one catches up; if neither is, the session diverged.

**A diverged session is never silently resolved.** Download keeps the local file and writes the remote copy beside it as `*.remote-fork-<stamp>`; download also offers force, which takes one side explicitly. DSH rewrites the tail of a log as a turn completes (an interrupted tool result is replaced by the real one), so a diverged pair is usually genuine work on both sides rather than a bug.

**Registration goes through the service.** A downloaded session is attached with `workspaceRegistry.attachSession()`, never by editing `workspace.json` directly: the host owns that file and overwrites outside edits from memory. The host also caches session headers, so a session whose `cwd` changed underneath a running DSH is rejected until DSH restarts.

**An empty repository needs a seed.** A repository with zero commits rejects `POST /git/blobs` with 409, so the first commit is created through the Contents API.

**Attachments are supplemented, not re-uploaded.** When a session body is unchanged and uploads as `skip`, attachments it references but the remote index does not list are still pushed on their own.

**Attachment restore has a fallback.** Download reads the `manifest.json` list, and also parses the `sha256:` references out of the session body; when the index is stale it looks for `<project>/attachments/<sha>.*` in the remote tree.

**Prefix comparison costs no network.** The manifest records the body length and hash of every upload, so the preview decides "this is the earlier version plus more frames" by slicing the local file. A 2MB session previews in seconds instead of minutes.

## Safety boundary

The plugin writes to four locations and no others:

| Path | Purpose |
|---|---|
| `$DSH_HOME/github-sync/` | its own state, history, diagnostics |
| `$DSH_HOME/sessions/` | sessions you download or delete |
| `$DSH_HOME/attachments/v1/objects/` | attachments you restore or collect |
| the current workspace (**off by default**) | file and folder sync |

It starts no processes, runs no commands, writes no registry keys, edits no hosts file, mutates no environment variables, installs no proxy, and contacts nothing but `api.github.com` and `github.com`.

Other limits:

- **Private repositories only.** A public repository is refused at test time and at commit time.
- **Secret-shaped files are blocked outright**: `.env*`, `*.key`, `*.pem`, `*.pfx`, `*.p12`, `*.kdbx`, `*.keystore`, `id_rsa`, `id_ed25519`, `id_ecdsa`, `.npmrc`, `.netrc`.
- **Paths from the remote side are validated before use.** Session ids, attachment shas, and relative paths are checked against their expected shape and against the root they are joined to, so a poisoned index cannot write outside `$DSH_HOME`.
- **The token lives in the host process.** It sits in DSH's credential store and is never sent back to the browser.

[`tools/audit-safety.mjs`](../tools/audit-safety.mjs) checks these invariants statically.

## Cross-platform

The plugin is plain JavaScript: no native modules, no platform branches, the same code on Windows and macOS.

The one platform-dependent detail is how a workspace path becomes a sessions directory name. `lib/projectkey.mjs` encodes it the way DSH does (drive letters and separators folded to `-`), and `lib/sessiondir.mjs` falls back to reading the absolute `cwd` out of session headers when the computed directory does not exist. A difference in a platform's key algorithm therefore cannot make a machine's sessions invisible.

Hand-over rewrites the header `cwd` to the destination workspace, which is why a session written on Windows opens on macOS and the reverse.
