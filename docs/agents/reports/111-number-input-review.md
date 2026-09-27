# Review: #111 NumberInput (feature/ticket-111, 482e195…HEAD)

Two-axis review per `/code-review`: Standards and Spec ran as independent sub-agents against
`git diff 482e195...HEAD` (commits `ff6115a` and `8ef031b`), with issue #111, the approved Agent
Brief (`111-number-input-agent-brief.md`) and ADR 0009 as spec sources, and
`docs/agents/standards/` (coding, architecture, testing, design-system-components) plus the
Fowler smell baseline as standards sources. `npm run fallow:agent -- --base 482e195` gave the
reading order. Findings were verified by hand against the files and the confirmed ones fixed in
`1e03769`. Date: 2026-09-28; reviewer: an Orca worker (Claude), separate from the implementer.

## Standards axis

Hard findings (documented standards):

1. **`unknown[]` in the spec** (coding.md › Interfaces and types: `unknown` only at a genuine
   untrusted boundary) — the pasted-text test collected `Subject<string>` emissions into
   `unknown[]` and then asserted `typeof emitted === 'string'` in a loop, a type-level tautology
   already covered by the literal `toEqual`. **Confirmed, fixed**: typed `string[]`, loop removed.
2. **Several behaviours per test** (testing.md › Location and naming: Arrange–Act–Assert, one
   behaviour per test) — four tests chained act/assert phases: defaultValue rerender *and*
   remount restore; submission as typed *and* required presence; native reset *and* `reset$`;
   disabled editing/emission/submission *and* `reset$` clearing. **Confirmed, fixed**: split into
   one behaviour each (17 → 20 tests). Coverage is unchanged; `reset$` emptying stays proven by
   its own test.
3. **Recipe header copies Input's comment** (coding.md › Comments: "a second copy drifts";
   cite, don't restate) — the 5-line header was within the 6-line budget, but its last three
   lines restated `Input.tsx`'s token/ring/face reasoning verbatim. **Confirmed, fixed**: the
   header now cites Input's reasoning and the two ADRs in one line (4 lines total).

Judgement calls, left as they are:

4. **`!disabled` guard on `onInput`** — `Input` has no guard; a browser never dispatches `input`
   on a disabled control, so the branch only matters to jsdom's `fireEvent`. Kept: the brief
   names "Disabled prevents user edits and output events" as a contract, the guard makes that
   hold on every platform, and it is a one-liner within coding.md's JSX rule.
5. **Repeated `switch (reading.kind)` and the `complete`/`unfinished`/`toNumber` clump in the
   parsing stories** — Repeated Switches and Data Clumps by the baseline. Left deliberately, as
   in #107: each story's source is the consumer's own loop as documentation, and bundling a
   parser shape would read as a library parser the brief forbids publishing.
6. **Hand-rolled subscription array in `ClearAndRestoreExample`** duplicates `Dialog.stories`'
   `unsubscribeAll`. Left: stories have no shared home and importing one story from another is
   a cross-component dependency.

Checked and clean: exported `INumberInputProps` from its own module; barrel carries the component
only; no-variant `cva()` (as `Cluster`, `Footer`); closed props, `testId`, no library wording,
`undefined` never `null`, `import type`; story `style={{ width }}`, relative `./NumberInput`
import, module-level Subject and barrel import in the spec all have repo precedent; CONTEXT.md
terminology (field, control, consumer) consistent across README, TSDoc and stories. Dismissed
advisory tool findings: fallow's Input/TextArea/NumberInput clone groups (each control owning its
whole recipe is the documented design, and the brief forbids sharing internals across siblings).

## Spec axis

No missing requirements, no scope creep, no incorrect implementation. Verified by tracing code:

- `git diff 482e195...HEAD -- src/Interaction/Input` is empty; `NumberInput.tsx` imports no
  sibling and owns its recipe.
- Every brief acceptance criterion maps to evidence: closed props type and textbox/`inputmode`
  semantics; distinct `''`/`0`/`-`/`1.`/`1,5`/`1.5` preserved and emitted; pasted `12abc`,
  `1e400`, `Infinity`, `NaN`, `' 7 '`, `'1 000,50'` retained; defaultValue/rerender/remount/
  native reset/`reset$` contract with teardown on replacement and unmount; disabled, presence,
  invalid/error, unique ids, static markup with globals stubbed, `FormData` carrying `1,5` and
  `twelve`; EN/DE parsing stories; README caller obligations; glossary entry present; mobile
  keyboard non-verification documented in the implementation report.
- Story parsers traced by hand: EN rejects `12abc`, `1e400`, `Infinity`, `' 7 '`, `12,50`;
  `1.` and `-` unfinished; `0` accepted as zero; `12.50` accepted. DE mirrors with the comma and
  rejects `12.50`. The whole string is matched before `Number`, so no numeric prefix is accepted;
  the finite check is reachable only through digit overflow, as the story comment says.
- Disabled contract: emission gated, `reset$` still clears; tested.
- Stories cover empty, zero, decimals (dot and comma), incomplete, invalid/pasted, clear/restore,
  native reset versus `reset$`, disabled, required/optional (English and German); themes come
  from the global theme toolbar, as for Input.

Minor observations, no change: the README snippet references `savedMaxPrice` and
`maxPriceReading` without declaring them (illustrative, like the other README snippets); the
implementer's Chrome evidence was not re-run here and is candid about what it did not cover.

## Checks

After the fixes: `npm run lint` (147 files), `npm run typecheck`, `npm run test` (45 files,
814 tests, 20 NumberInput), `npm run build` and `npm run build-storybook` all pass; the
pre-commit hook re-ran lint, typecheck and tests on `1e03769`.

## Remaining limitations

- Release and recording the published version on #111 (issue AC 10, brief AC 11) happen after
  merge via semantic-release; not part of this branch.
- No mobile or on-screen keyboard was observed; `inputmode="decimal"` is verified as an
  attribute and a live desktop property only, and neither README nor brief promises more.
