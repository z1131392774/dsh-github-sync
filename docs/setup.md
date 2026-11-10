# Setup

*[中文](setup_zh.md)*

Three things stand between a fresh install and a working sync: an empty private repository, a fine-grained token, and a panel that accepts both. It takes about five minutes and needs no command line.

> A token is a password. It lives in `$DSH_HOME/.credentials.yaml`, the panel never echoes it back, and it belongs in no chat, screenshot, or issue.

## Why the repository must be private

The plugin uploads full conversations — the code you asked about, the errors you pasted, the wrong turns you took. A public repository publishes all of it, and search engines find it.

The plugin enforces this: if the repository is not private, the connection test fails and no transfer is attempted.

## Create the repository

1. Open <https://github.com/new>.
2. Name it anything, for example `dsh-sync`; the plugin uses the name as a project prefix.
3. Set **Visibility** to **Private**.
4. Leave README, `.gitignore`, and license unchecked. A repository with commits also works, but an empty one exercises the zero-commit path and avoids a merge on the first upload.
5. Create it.

## Create the token

1. Open <https://github.com/settings/tokens?type=beta> and choose **Generate new token**.
2. Name it `dsh-github-sync`; set an expiry you will remember, 90 days or a year.
3. Under **Repository access**, choose **Only select repositories** and tick the repository above. Tick every repository you intend to sync with.
4. Under **Repository permissions**, set **Contents** to **Read and write**. **Metadata** turns read-only on its own.
5. Generate, and copy the `github_pat_…` string immediately.

The token is shown once, and a fine-grained token cannot be widened afterwards — a wrong repository selection means a new token, not an edit.

A classic token with the `repo` scope also works and is worse: it grants every repository you can reach.

## Fill in the panel

1. Open DSH and click **GitHub Sync** in the sidebar.
2. Open settings (⚙, top right).
3. Paste the repository as `owner/repo`, `https://github.com/owner/repo`, or `https://github.com/owner/repo.git` — all three are accepted.
4. Leave the branch at `main` unless you have a reason.
5. Paste the token, save, and press **Test connection**.

A green dot and "connected" mean the panel is ready, and every local session row gains a sync badge.

## A second machine

The same repository serves any number of machines; a machine needs no new repository and, strictly, no new token.

1. Install the plugin.
2. Repeat the panel step with the **same repository**.
3. Use a **separate token per machine** if you can — revoking one machine then costs nothing.
4. Press refresh: the remote column lists what is already there.
5. Tick a session, download, confirm. It attaches to the workspace you choose and continues from where it stopped.

Machines merge: before writing, each one re-reads the remote index and unions it with its own plan, so records are not overwritten by whoever commits second. When both sides changed the same session, the preview marks it `blocked` and asks which side wins.

## Certificate errors

`fetch failed (UNABLE_TO_VERIFY_LEAF_SIGNATURE)`, `SELF_SIGNED_CERT_IN_CHAIN`, or `unable to get local issuer certificate` mean something on the machine is decrypting HTTPS and presenting its own root certificate. The browser accepts it because the system trusts it; Node trusts only its built-in list.

Common suspects: SteamTools / Watt Toolkit (issuer `CN=SteamTools Certificate, O=BeyondDimension`), Fiddler or Charles with HTTPS decryption on, and security suites with a web-shield feature.

**Bypass the interception.**

Add these to that tool's bypass or skip list:

```
api.github.com
github.com
*.githubusercontent.com
```

**Turn the decryption off.** SteamTools: disable GitHub acceleration. A packet capture tool: stop capturing or disable HTTPS decryption. A security suite: disable HTTPS scanning.

**Trust the certificate explicitly**, if the tool is your only route to GitHub. Export its root certificate and point Node at it:

```powershell
$cert = Get-ChildItem Cert:\LocalMachine\Root, Cert:\CurrentUser\Root |
  Where-Object { $_.Subject -match 'SteamTools' } | Select-Object -First 1
$pem = "-----BEGIN CERTIFICATE-----`n" +
  [Convert]::ToBase64String($cert.RawData, [Base64FormattingOptions]::InsertLineBreaks) +
  "`n-----END CERTIFICATE-----`n"
Set-Content -Path "$env:USERPROFILE\.dsh\proxy-ca.pem" -Value $pem -Encoding ascii
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', "$env:USERPROFILE\.dsh\proxy-ca.pem", 'User')
```

Restart DSH completely; environment variables reach only new processes. This hands that certificate's owner the ability to read Node's HTTPS traffic — it is already reading the browser's, so the trust is not new, but revoke it when the tool goes away:

```powershell
[Environment]::SetEnvironmentVariable('NODE_EXTRA_CA_CERTS', $null, 'User')
```

## Rotating a token

1. Create a new token for the same repository with the same permissions.
2. Paste it in the panel, save, test.
3. Delete the old token at <https://github.com/settings/tokens>.

A leaked token should be deleted first and replaced second. GitHub records each token's last use, which tells you whether it was used.

## Common errors while configuring

| Symptom | Cause | Fix |
|---|---|---|
| `404 Not Found` | Name wrong, token not scoped to it, or the repository does not exist | Check **Repository access** on the token |
| `401 Unauthorized` | Expired, revoked, or copied incompletely | Generate and paste again |
| `403` / `Resource not accessible` | Missing **Contents: Read and write** | New token with that permission |
| "This repository is public" | Visibility is public | Settings → Change visibility → private |
| "The token is corrupted" | Non-token text was stored | Paste the token again |
| "Failed to seed the empty repository" | The Contents API seed failed | Create a README on GitHub, then retry |
| Zero sessions listed | None exist in that workspace, or the directory key did not resolve | Switch workspace; if still empty, open **Diagnostics → Copy** and read the `平台:` (platform) and `会话目录(应有):` (expected session directory) lines |

## What gets written here

| Path | Contents |
|---|---|
| `$DSH_HOME/github-sync/` | plugin state, history, diagnostics |
| `$DSH_HOME/sessions/` | sessions you download or delete |
| `$DSH_HOME/attachments/v1/objects/` | attachments you restore or collect |

The token sits in `$DSH_HOME/.credentials.yaml`, which DSH manages. The workspace is touched only when file sync is enabled, and nothing outside these paths is read or written.
