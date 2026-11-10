# AGENTS.md

*[中文](AGENTS_zh.md)*

Standing orders for anyone changing this repository. Read this file at the start of every session. The standard behind it lives in [docs/AGENTS.md](docs/AGENTS.md); how to make and verify a change lives in [docs/development.md](docs/development.md).

Rules here stay short. Detail belongs in the linked home, never in this file.

## Project facts

- Stack: JavaScript ESM, no build step, Node 22.15+, DSH 0.2.1-rc.5+. [`index.js`](index.js) is the host half, [`client.js`](client.js) the browser half, [`lib/`](lib/) the shared logic.
- Verify: `node tools/selftest.mjs`, `node tools/audit-safety.mjs`, `npm run check`.
- Build: none. The files publish as written.

## Before you start

- **Restate the task and your plan in one message before editing.** If two readings of the request are plausible, ask which one.
- **Inspect the working tree first.** `git status` shows whether someone is mid-change. Treat unfamiliar uncommitted work as the user's: read it, never revert or reformat it.
- **Find the existing owner before adding anything.** The panel, the plan builders, and the index merge each have one home; extend it instead of adding a second mechanism.

## Contracts this project does not break

- **Sync stays manual.** No timers, no polling, no upload on turn end. A user who did not press a button must never see data leave the machine.
- **Private repositories only.** Every path that writes to GitHub refuses when the repository reports itself public. Changing that check requires an explicit decision, not a comment.
- **Rewrite the header frame, nothing else.** Cross-machine `cwd` differs by design; recompressing body frames breaks the append-only byte chain that conflict detection depends on.
- **Write only inside the four roots** named in [docs/how-it-works.md](docs/how-it-works.md#safety-boundary): plugin state, the sessions root, the attachment objects root, and the workspace opened by an explicit toggle.
- **Tokens never leave the host process.** Read them through `ctx.credentials`, never log, echo, or store them in plugin state.

## Change discipline

- **One change, one purpose.** A bug fix carries no refactor; a feature carries no dependency bump.
- **Make the smallest diff that solves the problem.** No drive-by formatting, no speculative abstraction.
- **Match the surrounding code**: the same defensive checks, the same Chinese UI strings, the same error shape.
- **Fail loud, near the cause.** Reject bad input at the boundary; never substitute a default silently.
- **Treat the wire format as a contract.** `manifest.json` and the session file layout are shared across machines and versions; a change needs a migration or a version bump.

## Verification

- **Run what covers your change, then widen only across a boundary.** Report the exact command and its output.
- **Documentation changes run `npm run check`**, which enforces budgets, links, anchors, and the bilingual pairing.
- **Behavior changes update [`tools/selftest.mjs`](tools/selftest.mjs)** in the same commit. A test that only restates the implementation is replaced, not kept.
- **Read your own `git diff` before handing off.** Debug output, dead code, and half-written comments are defects.

## Documentation

- **English is the source.** Every document has a Chinese twin beside it whose name ends in `_zh.md`; see [the bilingual rule](docs/AGENTS.md#bilingual-documents).
- **Edit the English first, then the twin, in one commit.** A pair that drifts is worse than a single language, because the reader trusts the copy that is wrong.

## Reporting

- **Say what you did, what you verified, and what remains uncertain.** Name files and commands.
- **Report failures plainly and stop dependent work.**
- **Ask when the rules do not cover the situation.**
