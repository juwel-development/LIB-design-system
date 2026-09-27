# NumberInput implementation evidence (#111)

Date: 2026-09-28. Implemented by an Orca worker (Claude) on branch `feature/ticket-111`,
cut from local `main` at `482e195` (package 3.8.0), against the approved
[agent brief](./111-number-input-agent-brief.md). Nothing was pushed, merged, published or
versioned; review and release stay with the coordinator. This report records what shipped
and how it was verified, including what was **not** verified.

## What shipped

- `src/Interaction/NumberInput/NumberInput.tsx` - one roster entry with its own CVA recipe and
  Input's field anatomy: label, `<input type="text" inputmode="decimal">`, optional marker,
  hint and error. Exported `INumberInputProps` from its own module; `NumberInput` added to
  `src/index.ts`. No import of a sibling component.
- Props: required `label`, `name`; optional `required`, `optionalLabel`, `hint`, `invalid`,
  `errorMessage`, `disabled`, `placeholder`, `defaultValue`, `onInput$: Subject<string>`,
  `reset$: Subject<void>`, `testId`. No `autocomplete`, no variant axis, no attribute bag,
  no `min`/`max`/`step`/`pattern`/length props.
- Behaviour: `onInput$` emits the current text on user edits only, gated off while disabled;
  `reset$` empties the live node in place (subscription torn down on replacement and unmount);
  `defaultValue` initialises on mount only; native form reset restores it silently.
- `README.md` gains a `## NumberInput` section stating the caller obligations (whole-string
  parsing, finite check, blank versus zero, saved-state loop, native reset versus `reset$`,
  server-side validation, keyboard hint not promised). `CONTEXT.md` already carried the agreed
  glossary entry; the **Field** entry now lists NumberInput among the fields.
- Stories: Empty, Zero, Decimal, CommaDecimal, Incomplete, InvalidPasted, Required, Optional,
  OptionalInAnotherLanguage, Disabled, ClearAndRestore (Tabs remount loop), NativeResetVersusReset,
  EnglishParsing and GermanParsing. Themes come from the Storybook theme toolbar.

## Test evidence

Seventeen public-behaviour tests in `NumberInput.spec.tsx`, imported through the barrel,
written red before each slice (barrel/anatomy; streams and defaults; forms, disabled,
accessibility and static markup). They assert on roles, attributes, values, `FormData`,
emitted strings and `Subject.observed`, never on class strings or internal state:

- Closed props type (`expectTypeOf` over `ComponentProps`), textbox role, `type=text`,
  `inputmode=decimal`, no spinbutton, no numeric validation attributes.
- Distinct `'0'`, `''`, `'-'`, `'1.'`, `'1,5'`, `'1.5'` preserved and emitted in order;
  `12abc`, `1e400`, `Infinity`, `NaN`, `' 7 '`, `'1 000,50'` retained and emitted as strings.
- `defaultValue` on mount, unchanged edit across a rerender with a new default, restore on
  remount; `reset$` keeps the node and focus and emits nothing; teardown on replacement and
  unmount.
- `FormData` carries `1,5` and `twelve`; `required` rejects only the empty field; native reset
  restores the default and `reset$` empties, both silent.
- Disabled: unfocusable, no emission, absent from `FormData`, still cleared by `reset$`.
- No emission for render, message changes or remount; label/hint/error associations with stale
  error removal; caller-only optional wording; unique ids across two fields; `testId`.
- `renderToStaticMarkup` with `window` and `document` stubbed to `undefined` produces the name,
  default text, `required`, `inputmode`, `aria-invalid` and resolvable `for`/`aria-describedby`.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 147 files checked |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 45 files, 811 tests (17 NumberInput) |
| `npm run build` | Passed; `NumberInput` present in `dist/design-system.js` and `dist/types` |
| `npm run build-storybook` | Passed |

All 16 pre-existing Input tests still pass; `Input.tsx` is untouched.

## Browser evidence

The dev Storybook was driven through Chrome DevTools (real keystrokes, not synthetic events)
in Chrome 154 on macOS. Observed:

- EnglishParsing: typing `1.` leaves the value `1.`, `inputMode` `decimal`, `type` `text`, no
  `role`, no `min`/`max`/`step`/`pattern`/`maxlength`, consumer status "Keep typing…", and a
  3px solid focus outline. Typing on to `1.250` reads "Songs priced up to 1.25.". Typing `12abc`
  after it leaves `1.25012abc` intact (nothing truncated or converted), `aria-invalid="true"`,
  the consumer's error text associated through `aria-describedby`, and the border and error text
  in the error role. Replacing with `0` reads "Free songs only."; Backspace to blank reads
  "No price limit." - blank and zero are distinct states.
- GermanParsing: Tab focuses the field with `:focus-visible` true; typing `12,50` is accepted
  ("Songs bis 12,5."); appending `.` is rejected with the German error text, by the consumer's
  own rule.
- ClearAndRestore: typing `3` after the saved `250`, switching to Results shows "Showing songs
  priced up to 2503." with the field unmounted; returning to Filters remounts a field holding
  `2503`; Clear empties it in place (one input node, empty) and Results then reads "Showing
  every song, with no price limit.".
- Themes: after letting the colour transition finish, toggling `.dark` re-points the control's
  border, text, outline, label and hint colours; the error role re-points as well. The focus
  outline is 3px solid in both.

## Not verified

- **No mobile or on-screen keyboard was inspected.** `inputmode="decimal"` was confirmed as an
  attribute in jsdom and as a live property in desktop Chrome; which keyboard iOS, Android or a
  desktop touch device actually shows, whether it offers a minus key, and which decimal separator
  it carries were not observed. The brief and README promise none of these.
- No axe scan was run in the browser; associations were checked by hand in the a11y tree and by
  the spec. The Storybook a11y addon remains available for the reviewer.
- Native form reset and the disabled state were verified in jsdom only; both are platform
  behaviour rather than component code.
- IME composition survival on `reset$` inherits Input's reasoning (issue #64) and was not
  exercised with a real IME.
