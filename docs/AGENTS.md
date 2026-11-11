# AGENTS.md — Repository instructions and documentation

*[中文](AGENTS_zh.md)*

This file says where each kind of statement lives in this repository, how those places load, how to write a rule, and how the bilingual pairs work. How to make a change and verify it lives in [development.md](development.md).

## The tier model

One fact, one home. Everywhere else, link to it.

| Tier | Belongs there | Does not |
| --- | --- | --- |
| Root [`AGENTS.md`](../AGENTS.md) | Standing orders an agent needs every session, one to three lines each, each linked to its home | Procedures, examples, anything restated from a linked document |
| Subtree `AGENTS.md` | Rules specific to that directory | Rules the root file states |
| [`docs/`](.) | Procedures, the data model, user guidance, standards like this one | Decision rationale, which rots once copied |
| [`.agents/skills/`](../.agents/skills/pre-push-checks/SKILL.md) | A procedure that applies in one situation, loaded when its description matches the task | Rules needed in every session |
| [`.agents/notes/`](../.agents/notes/README.md) | Why a decision was made, what lost, what it cost; the folder carries the status | Current behavior |
| [`README.md`](../README.md) | What the plugin is, how to install it, where to go next | Rules for agents |

Budgets, in words:

| File | Ceiling |
| --- | --- |
| Root `AGENTS.md` | 1,200 |
| Subtree `AGENTS.md` | 400 |
| Each document under `docs/` | 1,200 |
| `README.md` | 700 |

[`scripts/doc-budgets.json`](../scripts/doc-budgets.json) is authoritative and overrides these fallbacks. When a file passes its ceiling, move content to its proper home first, condense second, raise the ceiling last and say why in the change.

## Bilingual documents

English is the source of truth. Every document exists twice, side by side, and the Chinese copy is a translation — never a second original.

- **Naming.** `docs/usage.md` and `docs/usage_zh.md`. The suffix is `_zh`, the directory and the base name are identical.
- **Reciprocal links.** The first lines of each file link to its twin, so a reader lands in the language they want and an editor can find the pair.
- **One commit.** Change the English, then update the twin before committing. A drifted pair is worse than one language, because the reader trusts the wrong copy.
- **Translation, not rewriting.** The translator paraphrases for idiom rather than mapping words. Chinese that reads like translated English — stacked 的, 被 where a verb suffices, 进行/作出 before a noun, 之一, and and-strings of 和 — is a defect, not a style choice.
- **Freshness.** If the English changes after the twin was last written, `npm run check` reports the pair as stale. Retranslate the affected paragraph, or list the file under `pendingTranslations` in [`doc-budgets.json`](../scripts/doc-budgets.json) while the rewrite is in progress.
- **Same content.** Examples, tables, error strings, and code stay identical; only the prose changes. A Chinese file that carries a fact the English lacks is a bug in both.
- **Exclusions.** `CHANGELOG.md` and `RELEASE_NOTES.md` have no twin: they are append-only history, and a translated changelog drifts from the commits it describes. The list lives in [`doc-budgets.json`](../scripts/doc-budgets.json).

`npm run check` fails when a pair is missing, when the two files do not link to each other, when either file passes its budget, or when the twin is older than its source. A record whose Chinese half was forgotten fails the build rather than quietly going stale.

## How instructions load

Harnesses load the nearest instruction files automatically, broad to specific, deduplicated, and inside a byte budget that drops broader files first. Two consequences:

1. Do not duplicate a rule across tiers to make it more visible; duplication spends budget twice and creates two facts that will drift.
2. Put a rule as deep as it can go while still reaching everyone who needs it.

## Writing a rule

- **Imperative, one clause, bold lead.** The bold lead is what a scanning agent finds; the sentence after it carries the detail.
- **Name the trigger and the action.** "Run the self-test after changing a plan builder" beats "keep tests green".
- **Attach the reason or the link.** Put long rationale in a note and link it.
- **State current behavior.** History belongs in git and in notes.
- **Do not restate a catalog.** File lists and route tables belong to the source.
- **Reserve emphasis.** Bold on everything is bold on nothing.

A rule earns its place only if it changes a decision an agent would otherwise get wrong.

## Maintaining these files

- **Review after any incident** where an agent did the wrong thing: add the missing rule or delete the one that misled it.
- **Grow downward.** When a file nears its budget, move a paragraph into the document that owns it and leave one line.
- **Prefer deletion.** A stale rule teaches the wrong lesson actively.
- **Check the pair, the links, and the age mechanically.** `npm run check` resolves local links, heading anchors, budgets, pairing, and which half of a pair moved last.
- **A rule with no executor is advice.** Say so in the rule, or accept that review is the only enforcement.
- **Treat a violation as a documentation bug first.** If an agent ignores a rule repeatedly, the rule is vague, buried, or contradicted elsewhere.

## The slop checklist

Run this over any instruction file before committing:

- Duplicated rules: search a distinctive phrase; keep one home, link the rest.
- History outside its permitted home: state the current fact, link the record.
- Status words in prose ("implemented", "planned"): the code and the tree carry status.
- Hand-copied catalogs: link the source.
- Reasoning transcripts: keep the conclusion, delete the path taken.
- Paragraph walls: split them or demote the detail.
- Emphasis inflation: bold on everything means bold on nothing.
