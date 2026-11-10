# AGENTS.md — Gate scripts

*[中文](AGENTS_zh.md)*

Rules for the scripts in this directory, which enforce documentation invariants.

- **Dependency-free Node ESM.** A gate runs from a fresh checkout with no install step. Adding a dependency means the gate is unavailable exactly when it is needed.
- **Budgets and exclusions live in `doc-budgets.json`.** The manifest is authoritative; the script owns only the fallbacks for files it does not list. Never repeat a limit in another document.
- **Fail with location, exit non-zero.** Report `path:line`, print every finding, exit 1. A gate that warns and passes teaches everyone to ignore it.
- **An empty corpus is a failure.** A check that inspects nothing passes everything.
- **Treat unseen input as hostile.** A malformed manifest or a link escaping the repository stops the gate instead of degrading to a partial check.
- **Prove the check rejects.** Before committing a change, introduce the defect it should catch, watch it fail, then revert.
