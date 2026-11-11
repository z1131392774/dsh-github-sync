# Development guide

*[中文](development_zh.md)*

How to change this plugin and how to tell the change is done. The documentation standard lives in [docs/AGENTS.md](AGENTS.md); the standing orders are in the [root AGENTS.md](../AGENTS.md).

## The shape of the code

`index.js` runs in the host process: it owns the HTTP routes, the three agent tools, and the state file. `client.js` runs in the browser panel and ships unbuilt, so no bundler rewrites it and no dependency may be imported into it. `lib/` holds the parts both halves reason about — the session file format, the plan builders, the GitHub client.

A plan builder is pure in the sense that matters: it reads the local disk and the remote index, and returns the list of actions. It writes nothing. Everything that writes happens afterwards, in one place, with the plan in hand. Keep it that way; a plan that is also an executor cannot be previewed honestly.

## Change discipline

1. **Understand before editing.** Read the target file, its neighbours, and — for anything touching the session format — [`lib/zstdframe.mjs`](../lib/zstdframe.mjs) and [`lib/sessionlog.mjs`](../lib/sessionlog.mjs) first.
2. **Plan in writing.** What changes, what could break, how you will verify. More than three bullets means the change is too big for one pass.
3. **Change the smallest surface.** Extend the existing route or builder instead of adding a parallel one.
4. **Delete as you go.** Remove what your change makes obsolete, and repair the links to it.
5. **Keep commits legible.** One logical change per commit; the message says why.

## Failure and error handling

- **Validate at the boundary.** Route bodies, remote index entries, and session ids arrive from outside; check them before they become paths.
- **Refuse rather than degrade.** A public repository, an unsafe segment, or an unknown session version is rejected with a message naming the reason. Never substitute a default and continue.
- **Stop and report unknown outcomes.** A partial batch reports what landed and what did not; it does not claim success.
- **Preserve the cause.** Wrap with context, keep the original message. Log once, where the error is handled.
- **Name ignored errors.** An empty `catch` says what it expects and why continuing is safe.

## Verification ladder

Run the cheapest check that would catch the mistake, then widen only across a boundary.

1. **Focus.** `node tools/selftest.mjs` walks the pure logic — frame parsing, header rewrite, body comparison, path encoding, guard functions.
2. **The plan-level tests** when you changed how actions are decided: `node tools/test-upload-plan.mjs`, `node tools/test-force.mjs`, `node tools/test-guards.mjs`, `node tools/test-filesync.mjs`.
3. **The safety audit** when you added a route, an import, or a network call: `node tools/audit-safety.mjs`.
4. **The panel render test** when you touched layout or copy: `node tools/test-render.mjs` renders the panel with a stub React and asserts the wide and narrow contracts (one scroll surface on a phone, sticky action bar, where the settings sheet lands). It cannot see pixels — after it passes, still reload DSH once.
5. **Documentation:** `npm run check`.

Report the command and what it printed. "Should pass" is not a result. If something cannot run here, name it and say why.

## Review checklist

Read your own `git diff` top to bottom before handing off.

- Does the diff do one thing, and does the message say what and why?
- Does every changed file have a reason, with no formatting noise or debug output?
- Are remote-supplied values turned into paths only through the guards?
- Does the preview path still write nothing, and does the execute path still consume its preview token?
- Do the errors keep their cause and their Chinese wording?
- Do the docs and the Chinese twins still agree with the behavior?
- Are tokens, device ids, and absolute paths absent from code, tests, and logs?
- If someone reverted one hunk, would a test or the audit fail? If not, that hunk is unverified.

## Decision records

A note records a choice that outlives its diff: a format, a refusal, a trade-off future maintainers will argue about again. Notes live in [`.agents/notes/`](../.agents/notes/README.md), with the status in the folder name. Write one in the same change as the decision, and update the note that already owns it instead of opening a second.

A note is neither a changelog nor a tutorial. If a reader needs current behavior, the code and the docs carry it.

## Releasing

[releasing.md](releasing.md) owns the pre-release checklist. Bump `version`, add the entry to `CHANGELOG.md`, run the audit, and verify on both platforms before tagging.
