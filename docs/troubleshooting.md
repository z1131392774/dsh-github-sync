# Troubleshooting

*[中文](troubleshooting_zh.md)*

## The plugin

| Symptom | Cause and fix |
|---|---|
| `fetch failed` on test connection | The host cannot reach `api.github.com`. Check the proxy first: Node ignores `HTTPS_PROXY` unless `NODE_USE_ENV_PROXY=1` is set, and DSH reads that environment (or `$DSH_HOME/.env`) at startup. |
| `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, `SELF_SIGNED_CERT_IN_CHAIN` | Software on the machine is decrypting HTTPS. See [certificate errors](setup.md#certificate-errors). |
| `Git Repository is empty` (409) | Zero-commit repository. The first commit seeds through the Contents API; if it keeps failing, create a README on GitHub and retry. |
| `404 Not Found` | Repository name wrong, or the token is not scoped to that repository. |
| `401 Unauthorized` | Token expired, revoked, or truncated when pasted. |
| `403` / `Resource not accessible` | Token lacks Contents: Read and write. |
| "This repository is public" | Change visibility to private. The refusal is deliberate. |
| "The token is corrupted" | Something that is not a token was pasted. Paste it again. |
| Lots of `blocked` rows in a preview | A file matched the secret rules or exceeded the size limit; both are shown per row. |
| A session downloaded but the sidebar does not show it | The host caches session headers. Restart DSH, or reopen the workspace. |
| Same machine: deleted then re-downloaded, `its cwd resolves to …` | The running host still remembers the old header. Restart DSH. A real hand-over from another machine does not hit this, because that host never saw the id. |
| 0 sessions listed, though the workspace has some | The session directory key for that platform does not match, and the fallback scan missed. Open **Diagnostics → Copy** and send the `平台:` (platform), `会话目录(应有):` (expected session directory) and `sessions 根下 N 个目录:` (directories under the sessions root) lines. |
| macOS lists nothing | The same key mismatch, which Windows does not trigger. Diagnostics shows the computed name against the real one. |
| Download lands in the wrong workspace | The target defaults to the workspace you are currently viewing. Change the dropdown before downloading. |
| `blocked`: the session already belongs to another workspace | One session belongs to one workspace. Download into the workspace it is attached to, or detach it there first. Force does not override this, by design. |
| Download reports a fork instead of updating | Both sides changed the session. The remote copy is saved as `*.remote-fork-<stamp>` beside the local file; force one side if you know which is right. |
| Upload is slow or times out on a large session | The link to `api.github.com` is the bottleneck. Route DSH through the proxy and set `NODE_USE_ENV_PROXY=1`; a 2.5 MB session goes from two minutes to seconds. |
| `Attachment object is missing` after a hand-over | The session references an attachment object that is not on this machine. Copy `$DSH_HOME/attachments/v1/objects/<sha[0:2]>/<sha>` over, or delete the message that references it. |

## Known limitations

- **Attachments upload by reference.** Only attachments a session names are uploaded; an orphan costs nothing and is stored nowhere.
- **One attachment over 25 MB is skipped** and flagged in the preview rather than failing the batch.
- **A missing local attachment does not block an upload**, but the preview marks it with ⚠.
- **Only `version: 4` sessions are rewritten.** Other versions are refused rather than guessed at.
- **File download writes into the workspace root**, saving a copy under a new name when one exists. There is no three-way merge.
- **Deletion is permanent on both sides.** There is no recycle bin; a deleted remote session survives only in git history.
- **Sync is manual.** Nothing uploads on a timer or at the end of a turn.

## Where the state lives

| Path | Contents |
|---|---|
| `$DSH_HOME/github-sync/state.json` | repository, branch, device id, options |
| `$DSH_HOME/github-sync/history.jsonl` | recent transfers |
| `$DSH_HOME/.credentials.yaml` | the token, under the ref `GITHUB_TOKEN` |

Removing the plugin leaves all three behind; delete them to forget the configuration.
