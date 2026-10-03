# Button game action variants and wrapping - implementation evidence (#119)

> **Superseded in part by [119-review.md](./119-review.md) (2026-10-03).** This report was written
> before the maintainer's approved Agent Brief reached the issue, and the contract it records -
> `outline`, an outlined-then-filled `destructive`, an `inline` prop, a hard width floor - was
> corrected to the brief during review. It stays as the record of the first pass and its evidence.

Date: 2026-10-03. Implemented by an Orca worker (Claude) on branch `feature/ticket-119`, cut from
local `main` at `3739997` (package 3.9.1). Nothing was pushed, merged, published or versioned; review
and release stay with the coordinator and a human publisher. Implementation and publication are
separate: this records what shipped on the branch and how it was verified, including what was not.

## The contract, and why it has this shape

[#119](https://github.com/juwel-development/LIB-design-system/issues/119) carried no approved agent
brief and no comments, so the contract below was decided against the component standard, ADR 0008
and ADR 0011, the `.out-of-scope` rejections, and the approved #114 brief it has to coexist with.

- **`variant="outline"`** - the quiet secondary. Transparent fill, boundary in `controlBorder`
  (the one edge an unfilled control reads, >=3:1 against `surface`), `foreground` text, hover
  tints with `backing` (constrained >=4.5:1 against `foreground` already). Disabled follows
  Input: `disabled` edge, `muted` ink, no fill. The `control-boundary-independent-of-fill`
  rejection refuses an edge on the *filled* Button and names an unfilled control a consumer
  reaches for instead as the open question; this is that unfilled control, and no filled
  variant changes.
- **`variant="destructive"`** - boundary and text in the `error` status tone at rest; on hover
  fills with `error` and takes `surface` as ink. Both positions are discharged by the existing
  4.5:1 `error`-against-`surface` constraint read symmetrically (ADR 0011, now amended), so
  **no palette role was added and `PaletteTokens` is unchanged** - a consumer theme object
  keeps compiling. The hover inverts rather than tinting with `backing` because `error` text on
  `backing` measures 4.11:1 in the shipped light theme. `Palette.spec.ts` pins the reading.
- **`inline`** - a structural boolean (ADR 0008's second test: whether the width floor applies
  at all; the no-floor alternative is attested by `ghost` and by the consumer override recorded
  in `.out-of-scope/control-boundary-independent-of-fill.md`). It drops `--control-min-width`
  and takes the `px-3` inset all five field controls render; `ghost` is untouched.
  Content-*inheriting* profile actions are #114's `plain` variant, which this ticket does not
  duplicate - the two serve different jobs (a faced action sized to its content versus an action
  with no face at all) and the division is written into README and `CONTEXT.md`.
- **Wrapping** - the base drops `text-nowrap` and adds `text-balance`. A label breaks only where
  its holder is narrower than the words, which is the case that used to overflow; a short label
  in a wide row renders byte-for-byte as before. No break inside a word, as nowhere else in the
  library: `overflow-wrap: break-word` was tried and measured as a no-op inside the inline-flex
  button (the text item is sized to its longest word, so the line is never narrower than it),
  and `anywhere` would let a flex row squeeze a button down to letters. The commit carries a
  `NOTE:` footer for the behaviour change, per the architecture standard.
- **Disabled fill** moved from the recipe base into `primary`, `secondary` and `ghost`, which
  keep it; the rendered output of those three is unchanged (pinned by spec).

Not added: a filled destructive variant (would need `errorHover` and an `errorForeground` role,
i.e. new required `PaletteTokens` members or a theme migration), a size scale, any `className`
or `style` prop, a confirmation or announcement behaviour, and any game-specific action.

## What shipped

- `src/Interaction/Button/Button.tsx` - one recipe: base, five `variant`s, an `inline` boolean,
  two `compoundVariants` for the floored/inline inset. Props: `children`, `onClick$`, `disabled`,
  `testId`, `ariaLabel`, `type`, `variant`, `inline`. No new exports; `src/index.ts` untouched.
- `src/Theme/Palette.ts` - the `error` role's TSDoc names Button as a carrier. Values unchanged;
  `tokens.css` and its single-theme siblings did not need regenerating.
- `README.md` - a `## Button` section (variants, the destructive pairing rule, `inline`, long
  labels). `CONTEXT.md` - **Destructive action**, **Outline action**, **Inline fit** entries.
  `docs/adr/0011` - an Amendments section recording the new `error` carrier.
- Stories: `Outline`, `Destructive`, `DestructiveSymbolOnly`, `ActionVariants`, `Inline`,
  `InlineBesideField`, `LongLabels`, `LongLabelsInActionsRow`, `KeyboardFocus` (play function
  tabs onto the first button), `DisabledVariants`; the seven existing stories are unchanged.

## Test evidence

Written red first (18 failing against the shipped recipe, then green). `Button.spec.tsx` grew
from 71 to 89 tests; the per-variant contract checks (elevation, motion token, radius token, focus
ring drawn as outline with colour at rest, face, body size, min-width token) now run over all five
variants. New: closed prop surface via `expectTypeOf` over `ComponentProps`; accessible name from
the label and from `ariaLabel` on every variant; native `disabled` with no emission on every
variant; outline's edge/fill/ink and backing hover; destructive's tone, inverted hover and no
backing tint; unfilled disabled treatment; the three filled/ghost disabled treatments unchanged;
`inline` dropping the floor and taking `px-3` on the four faced variants, the floor kept without
it, ghost identical either way; no `text-nowrap`, `text-balance`, no forced word break.
`Palette.spec.ts` gains two cases pinning `error` at >=4.5:1 against `surface` as the destructive
hover's ink in both themes.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed; 153 files |
| `npm run typecheck` | Passed |
| `npm run test` | Passed; 47 files, 909 tests (89 Button, +2 Palette) |
| `npm run build` | Passed; `dist/types/Interaction/Button/Button.d.ts` carries `inline?: boolean \| null \| undefined` and the five-value `variant` |
| `npm run build-storybook` | Passed |
| pre-commit hook on `56e7359` | lint, typecheck and the full suite green |

## Browser evidence

Playwright 1.x installed in the session scratchpad driving the installed Google Chrome
(`channel: 'chrome'`, headless) against `storybook dev` on port 6119, in an isolated context per
theme, no shared browser selection. Facts were read with `getComputedStyle` and
`getBoundingClientRect`; screenshots were kept in the scratchpad only. Both themes gave the same
geometry; colours below are light / dark.

- **Rest colours.** outline: transparent fill, `rgb(100,116,139)` / `rgb(148,163,184)` edge
  (`controlBorder`), `foreground` text. destructive: transparent fill, `rgb(214,51,132)` /
  `rgb(244,143,177)` edge and text (`error`). primary, secondary and ghost unchanged.
- **Hover.** destructive fills `rgb(214,51,132)` with `rgb(255,255,255)` text in light and
  `rgb(244,143,177)` with `rgb(15,23,42)` text in dark - `error` fill, `surface` ink. outline
  fills `rgb(241,245,249)` / `rgb(30,41,59)` - `backing` - and keeps its edge and ink.
- **Focus.** Tabbing across the five variants in the `KeyboardFocus` story: each in turn is
  `document.activeElement` and shows `outline-style: solid`, `outline-width: 3px`,
  `outline-offset: 2px`, `outline-color` `rgb(71,85,105)` / `rgb(203,213,225)` (`focusRing`);
  fill and edge hold still. At rest `outline-style: none` on all five.
- **Disabled.** primary/secondary/ghost: `disabled` fill, as before. outline/destructive:
  transparent fill, `disabled` edge, `muted` ink; hovering a disabled destructive keeps the fill
  transparent. `cursor: not-allowed` on all five.
- **Inline fit.** Floored outline/destructive/primary/secondary: 168px wide (`--control-min-width`
  10.5rem), 24px inset. Inline: 76.4px (filled) and 78.4px (edged) wide for the same label,
  `min-width: 0`, 12px inset. ghost 68.4px and 8px inset in both rows. Beside an Input: the Input
  and the inline outline button are both 43.5px tall with 12px inset and a 1px edge.
- **Wrapping.** In a 14rem holder, a 58-character German label renders on 4 lines (3 on ghost) in
  every variant, `text-wrap-mode: wrap`, `text-wrap-style: balance`, text inside the content box,
  zero scroll overflow on the buttons, the holder and the page. In a 22rem single-line flex row,
  two long labels render on 3 lines each at 174.8px and 169.2px, both inside their content boxes,
  the row's right edge equal to its holder's, zero overflow. A standalone short `primary` is
  41.5px tall and 168px wide, as before.
- **Limit found and recorded.** A single word wider than the holder (`Marktforschungsschwerpunkt`
  in a 12rem holder) runs 19px into the inset and does not break; `overflow-wrap: break-word`
  did nothing here for the reason above. Documented in README, the recipe comment and the story
  text rather than papered over.

## Limitations and follow-ups

- Browser evidence is from Chrome only; `text-wrap: balance` falls back to normal wrapping where
  unsupported, which is the pre-#119 behaviour for a constrained label.
- An outline or destructive button is 2px taller than a filled one beside it (edge outside the
  inset, as Input). A flex row with the default `stretch` alignment evens them; a baseline-aligned
  Cluster shows the difference. Recorded in README.
- `Button.spec.tsx` keeps the existing token-contract style of asserting recipe classes for the
  new variants, alongside behavioural assertions (roles, names, `toBeDisabled`, emission).
- The `plain` variant for content-inheriting actions is #114's; its branch and this one both
  edit `Button.tsx` and `Button.stories.tsx`, so whichever merges second resolves a small
  conflict in the recipe's `variant` map and the stories' `argTypes.variant.options`.
- Release: not performed. Version to be recorded in consumer #195 by whoever publishes.
