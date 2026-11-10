# Choosing the narrowest check

*[中文](check-selection_zh.md)*

The rule is coverage, not convenience: run what would fail if the change were wrong, and nothing that would succeed regardless.

## Work an example

You changed the body-prefix comparison in `lib/sessionlog.mjs` and added a case to `tools/selftest.mjs`.

- `tools/selftest.mjs` covers the new branch and the old ones.
- `tools/test-upload-plan.mjs` adds coverage only if the plan path calls that function — search for the call rather than assuming.
- `tools/test-upload-plan.mjs` cannot fail for a change confined to comparison logic that it never exercises.

That is one command, not three. Running the whole suite as well is not diligence; it is a claim you did not need to verify.

## Widen when the change crosses a boundary

- **A shared helper:** every caller inherits the change. Run the tests for the modules that call it.
- **A default, a limit, or a config key:** behaviour changed in code you did not touch. Run the tests of the code that reads it.
- **The session format, the manifest schema, or the remote tree layout:** old repositories must keep working and new ones must stay readable. Exercise both directions, and keep `tools/test-multidevice.mjs` in scope — it is the merge path that breaks first.
- **Anything that decides a write:** paths, ids, shas, skip rules. `tools/test-guards.mjs` and `tools/test-boundaries.mjs` exist for exactly this, and a green selftest is not evidence.
- **Packaging:** the artifact, not the source, is what users install. `pnpm pack`, unpack it, and check that every file the README links to is inside.
- **Platform-dependent code:** the check must run on that platform. A green run on Windows says nothing about macOS session directories.

## Widen to the full suite when

- The change is repository-wide: a test helper, `tools/` conventions, the export surface.
- CI failed and you are reproducing it.
- The user asked for it.

## What does not count as evidence

- Reading the code and concluding it is correct.
- A test that asserts the implementation you just wrote rather than the behaviour it promises.
- A check that passed before the change and was not rerun.
- A check run on a different commit, branch, or working tree.
- `npm run check` after editing `docs/*.md` and nothing else — it proves the docs, not the code.
