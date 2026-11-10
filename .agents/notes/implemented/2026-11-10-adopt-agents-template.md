# Note: Adopt the agents-template instruction system

*[中文](2026-11-10-adopt-agents-template_zh.md)*

Status: implemented — the tiers, the pre-push skill, the documentation gate, and the bilingual pairing.

## Problem

The repository had grown to a user manual, a setup tutorial, a release checklist, and a publishing note with no rule about which of them owned what. Instructions lived only in the maintainer's habits, so an agent arriving cold had to infer them from the code, and the README carried facts that belonged next to the code that enforced them. Documentation also existed in one language per document, which meant a reader in the other language read a stale summary or nothing.

## Decision

The repository follows [agents-template](https://github.com/z1131392774/agents-template): a short root [`AGENTS.md`](../../../AGENTS.md), a standard one level down in [`docs/AGENTS.md`](../../../docs/AGENTS.md), conditional procedures in [`.agents/skills/`](../../skills/pre-push-checks/SKILL.md), and decisions in [`.agents/notes/`](../README.md).

Documentation is bilingual. English is the source; every document has a Chinese twin named `<name>_zh.md` beside it, the two link to each other, and [`scripts/check-docs.mjs`](../../../scripts/check-docs.mjs) fails the build when a twin is missing, unlinked, or over budget. The user-facing manual moved from `README.md` into [`docs/usage.md`](../../../docs/usage.md), [`docs/how-it-works.md`](../../../docs/how-it-works.md), and [`docs/troubleshooting.md`](../../../docs/troubleshooting.md), leaving the README as a landing page.

## Alternatives considered

**Keep the manual in `README.md` and translate it whole.** One file per language is simpler to browse, but the README is what the plugin market renders and what npm shows after install; a 3,000-word manual there buries the install steps. Splitting also let each half get the budget and the reader it deserves.

**Chinese as the source, English as the twin.** Rejected because the code, the commit history, and the upstream project are English-first, and because the translation is the half most likely to be produced by an agent.

**Let review catch missing translations.** A missing `_zh` file is invisible in a diff that only touches English — the failure is silent and cumulative, exactly the shape a gate should own.

## Consequences

Every documentation change now costs two files, and the pair can drift if a translator paraphrases a changed fact instead of following it. The gate catches absence and broken links, not meaning; meaning stays a review duty, which [`docs/AGENTS.md`](../../../docs/AGENTS.md#bilingual-documents) states plainly.

`CHANGELOG.md` and `RELEASE_NOTES.md` are exempt: they describe commits, and a translated commit log drifts from what git actually records.
