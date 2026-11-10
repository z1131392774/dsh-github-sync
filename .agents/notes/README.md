# Notes

*[中文](README_zh.md)*

Short decision records, written for whoever changes this code next. Code says what happens; the docs say how to use it; a note says why we chose this, what we rejected, and what it cost. Without that record the same argument returns in six months with less information.

One decision, one note. A note is not a changelog, a task list, or a tutorial.

## Layout and naming

Notes live at `.agents/notes/{lifecycle}/YYYY-MM-DD-topic-slug.md`. The folder is the status, and the note moves between folders when the status changes. The date is when the topic was first proposed, not when it was last edited; git records the rest.

- **`proposed/`** — reviewed before implementation, or not yet built.
- **`implemented/`** — the decision shipped. Kept true as the facts move.
- **`rejected/`** — considered and declined, kept only while its reasoning prevents a plausible repeat.

The tree is the inventory. Do not add an index: it duplicates the paths and turns every unrelated change into a conflict.

## When to write one

Write or update a note in the same change as the decision, when the reasoning outlives the diff: a file format, a refusal that looks surprising, a compatibility promise across DSH versions, a trade-off that will be re-argued.

Skip it for a mechanical edit, a copy change, or a bug whose cause the test already explains. Update the note that owns the decision instead of adding a second.

## The file format

The first three lines are fixed:

```markdown
# Note: <title>

Status: <proposed | implemented | rejected — one-line reason>
```

The status agrees with the folder and carries no dates.

The body opens with `## Problem`, written so it stands without the solution.

**`proposed/`**: `## Problem`, `## Proposal`, `## Alternatives considered`, `## Acceptance criteria`, `## Risks`.

**`implemented/`**: `## Problem`, `## Decision`, `## Alternatives considered`, `## Consequences`.

`## Decision` is present tense. Plans and checklists do not belong in an implemented note; either they happened or they did not. `## Testing` and `## Deferred` are fine where they state a present fact.

**`rejected/`** keeps its proposal-time shape; the verdict lives on the `Status:` line.

**`## Alternatives considered` is mandatory.** Each real alternative and why it lost, one bold-led paragraph each. Alternatives are recorded, never invented; if the reasoning is lost, say so in one line.

## Keeping an implemented note true

A note describes shipped reality, so it changes when the facts change: a renamed file, a moved route, a new default. Update those in the same change that moves them. The decision itself is not rewritten; a note whose decision changed is superseded, not edited into its opposite.

A superseded note may be folded into its successor and deleted only when the successor keeps every unique rationale, alternative, and consequence.

## Deleting and rejecting

- Delete an implemented note that recorded only a mechanical change, together with its inbound links.
- Delete a rejected note once it no longer prevents a plausible mistake.
- Never delete a note to win an argument. Supersede it and say what changed your mind.

Every note is bilingual like the rest of the documentation: `<topic>.md` and `<topic>_zh.md` in the same folder. The English is the source.
