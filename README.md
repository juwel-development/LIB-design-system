# @juwel-development/design-system

Shared design system: semantic colour tokens and React components, used across the
JuweL Development projects.

## Install

```bash
npm install @juwel-development/design-system
```

`react`, `react-dom` and `rxjs` are peer dependencies - the consumer provides them.

## Usage

```tsx
import { Button } from '@juwel-development/design-system';
import '@juwel-development/design-system/styles.css';
import { Subject } from 'rxjs';

const save$ = new Subject<void>();

<Button variant={'primary'} onClick$={save$}>Save</Button>;
```

Components take a `Subject` rather than a callback, so a click is an event stream the
consumer composes with the rest of its reactive code.

If the host already imports Tailwind and only wants the palette, take the tokens alone:

```css
@import "@juwel-development/design-system/tokens.css";
```

## Select

`Select` is a compound namespace: `Select.Root` renders a labelled, uncontrolled native
single-select field and `Select.Option` renders one text-only native option. Root starts on
an empty, selectable placeholder; `required` makes that empty value invalid without choosing an
option for the user.

```tsx
import { Select } from '@juwel-development/design-system';
import { Subject } from 'rxjs';

const marketChange$ = new Subject<string>();

<Select.Root
  label={'Home market'}
  name={'homeMarket'}
  required={true}
  placeholder={'Choose a market'}
  onChange$={marketChange$}
>
  <Select.Option value={'de'}>{'Germany'}</Select.Option>
  <Select.Option value={'gb'}>{'United Kingdom'}</Select.Option>
</Select.Root>;
```

`Root` requires `label`, `name`, and `placeholder`; its `children` compose `Select.Option`
members, including arrays, fragments, conditional children and consumer components that
render options. An empty field can omit children. Each `Option` requires a `value` and a
text-only `children` label, and accepts an optional `testId`. Option values must be
unique, stable, nonempty strings; every label and message is worded by the consumer.
The empty string is reserved for the placeholder, which remains selectable so an optional
field can be cleared. The browser owns keyboard navigation and the native popup.

Optional props are `required`, `disabled`, `defaultValue`, `onChange$`, `optionalLabel`,
`hint`, `invalid`, `errorMessage`, and `testId`. Labels always name the control; hints and
visible errors describe it. `invalid` exposes the consumer's validation state through
`aria-invalid`, and `errorMessage` renders only while invalid. Styling follows Input's
control, typography, focus-ring, motion, and state tokens.

`defaultValue` initializes a matching option on mount; omitted or unmatched values start
empty. Later `defaultValue` changes do not overwrite the user's selection. Reordered or
relabeled options preserve a surviving selected value; removing that option returns the
control to empty. Options arriving later do not apply an earlier unmatched default.

`onChange$` emits the selected string once per user change, including `''` on clearing.
Rendering, option replacement, and native form reset do not emit. The consumer owns the
Subject and must reconcile its own domain state when replacing options or resetting a form.
Native form reset restores the original default while that option remains mounted; if it
is removed, reset returns to empty. A newly mounted option does not inherit an earlier
option's reset default, even when it reuses its value. Keep React keys stable (use the
option value) across translation and reordering to preserve native selection and reset
state. No `reset$` prop is needed. A new record can initialize through a remount. Forms can
also read the current value directly by `name`, without any event subscription.

The previous unpublished `<Select options={...} />` API has been removed. For Home Market
in `g-label-manager` #125, put the existing field props on `Select.Root` and map market
records to `<Select.Option key={market.id} value={market.id}>{translatedName}</Select.Option>`
children. Keep `required` and the localized `placeholder` on Root; the empty option is
provided by Root, so callers do not compose another empty Option. Derive types with
`ComponentProps<typeof Select.Root>` or `ComponentProps<typeof Select.Option>` from React.
The consumer still awaits a published library release before changing its dependency.

## MultiSelect

`MultiSelect` is a compound namespace for selecting zero, one or several options
independently from a finite set: `MultiSelect.Root` renders a labelled one-line dropdown
trigger with the selected options as individually removable chips, a count for the chips
that do not fit, and a clear-all control; `MultiSelect.Option` renders one checkable row in
the dropdown. The consumer owns the options, the selection, every word and what the selected
set means; the library owns the control, the selection semantics, focus and the presentation.

```tsx
import { MultiSelect } from '@juwel-development/design-system';
import { BehaviorSubject, Subject } from 'rxjs';

const topics$ = new BehaviorSubject<readonly string[]>([]);
const topicChange$ = new Subject<readonly string[]>();
topicChange$.subscribe((next) => topics$.next(next));

<MultiSelect.Root
  label={'Main topics'}
  selected$={topics$}
  onChange$={topicChange$}
  emptyLabel={'No topics selected'}
  removeLabel={'Remove {label}'}
  clearLabel={'Clear topics'}
  overflowLabel={'+{count}'}
  hint={'Songs match any selected topic.'}
>
  <MultiSelect.Option value={'family'}>{'Family'}</MultiSelect.Option>
  <MultiSelect.Option value={'love'}>{'Love'}</MultiSelect.Option>
</MultiSelect.Root>;
```

The same control in German changes only the caller's wording:

```tsx
<MultiSelect.Root
  label={'Hauptthemen'}
  selected$={topics$}
  onChange$={topicChange$}
  emptyLabel={'Keine Themen ausgewählt'}
  removeLabel={'{label} entfernen'}
  clearLabel={'Themen zurücksetzen'}
  overflowLabel={'{count} weitere'}
>
  <MultiSelect.Option value={'family'}>{'Familie'}</MultiSelect.Option>
  <MultiSelect.Option value={'love'}>{'Liebe'}</MultiSelect.Option>
</MultiSelect.Root>;
```

`Root` requires `label`, `selected$`, `onChange$`, `emptyLabel`, `removeLabel`, `clearLabel`
and `overflowLabel`; `hint`, `disabled`, `testId` and `children` are optional. Each `Option`
requires a unique, stable string `value` and a text-only `children` label, and accepts a
`testId`. Options are direct children of `Root`; arrays and fragments are supported. The
wording contract is closed: `removeLabel` replaces `{label}` with the option's label to name a
chip's removal control, and `overflowLabel` replaces `{count}` with the number of selected
options hidden behind the count. There are no callback props and no built-in English; a
missing `hint` renders nothing.

**Streams.** `selected$` is a read-only `Observable<readonly string[]>` of the current
selection. Root renders the latest emission and nothing else: empty before the first
emission, empty again while a replaced source has not yet emitted, and updated silently on
every emission whether the dropdown is open, closed or disabled. Use a replaying source such
as a `BehaviorSubject` or `ReplaySubject(1)` so a remounted control shows the current state
at once. `onChange$` is a `Subject<readonly string[]>` that receives one fresh full proposed
selection per user edit - a toggle, a chip removal or clear-all - ordered by option order,
without duplicates and holding only supplied identities. Handed-in arrays are never mutated.
Rendering, opening, closing, option updates, source replacement and `selected$` emissions
never emit. Feed accepted proposals back into `selected$` immediately for ordinary
interaction; an unanswered proposal leaves the selection unchanged, and repeating the edit
repeats the proposal. Root subscribes only to `selected$`, unsubscribes on replacement and
unmount, and never completes either stream or assigns behaviour to their errors or completion.

**Caller obligations.** Keep option identities stable across reordering and translation, so
selection is preserved by identity; map options with the value as the React key. `selected$`
names supplied identities only: when an update removes options, remove their identities from
the selection in the same logical update. MultiSelect prunes nothing, invents nothing and
emits no synthetic change to reconcile invalid input.

**Behaviour.** The closed control stays on one line at every width: the leading chips that
fit are shown in option order, the rest are counted by `overflowLabel`, and at narrow widths
only the count remains. Overflow is recalculated on width, label and selection changes
without touching the selection; activating the count opens the dropdown, so every selection
stays reachable. Long chip labels truncate visually while the removal control keeps the full
name. The dropdown floats over the page on the shared `--elevation-floating` role, opens above
the control when the viewport below cannot hold it, is capped to the room it has and scrolls
its options. `disabled` keeps the selection visible, closes an open dropdown, disables every
control and emits nothing. With no options the dropdown opens empty.

**Keyboard and accessibility.** The visible label names the trigger and the option group; the
trigger exposes `aria-expanded` and, while open, `aria-controls`. Each option is a
`role="checkbox"` button with `aria-checked` and a tick that does not depend on colour. Enter,
Space or ArrowDown on the closed trigger opens the dropdown and focuses the first selected
option, or the first option; with no options focus stays on the trigger. Tab and Shift+Tab
traverse chips, clear-all and options normally with no focus trap; Space toggles a focused
option. Escape closes and returns focus to the trigger. Focus leaving the whole control, an
outside pointer interaction and the trigger itself close the dropdown without moving focus or
emitting. Chip removals and clear-all are named, non-submitting buttons outside the trigger:
a removal that takes its own focused control away moves focus to the next visible removal,
then the preceding one, then the trigger; clear-all returns focus to the trigger; a chip hidden
by overflow while focused hands focus to the trigger. This is a consumer-controlled selection
control, not a form field: it has no `name`, native submission, reset or validation.

## NumberInput

`NumberInput` is a labelled field for typed amounts and thresholds. It renders a text control
with a decimal keyboard hint (`inputmode="decimal"`) and keeps the entered text exactly as typed:
blank, `0`, `-`, `1.`, `1,5`, `1.5` and pasted content such as `12abc` stay distinct, untrimmed,
untruncated and unconverted. It is a separate roster entry with Input's field anatomy, not an
Input variant, and it does not extend Input's contract.

```tsx
import { NumberInput } from '@juwel-development/design-system';
import { Subject } from 'rxjs';

const maxPriceInput$ = new Subject<string>();
const maxPriceReset$ = new Subject<void>();

<NumberInput
  label={'Maximum price'}
  name={'maxPrice'}
  placeholder={'No limit'}
  hint={'Leave blank for no limit'}
  defaultValue={savedMaxPrice}
  invalid={maxPriceReading.kind === 'rejected'}
  errorMessage={'Enter an amount such as 12.50'}
  onInput$={maxPriceInput$}
  reset$={maxPriceReset$}
/>;
```

`label` and `name` are required. Optional props are `required`, `optionalLabel`, `hint`,
`invalid`, `errorMessage`, `disabled`, `placeholder`, `defaultValue`, `onInput$`, `reset$` and
`testId`, with Input's meaning. Derive the props type with `ComponentProps<typeof NumberInput>`.
There are no `min`, `max`, `step`, `pattern` or length props and no steppers, formatting or key
filtering ([ADR 0009](docs/adr/0009-content-rules-stay-with-the-consumer.md)); the control has
textbox semantics, not spinbutton semantics.

**The consumer owns interpretation.** `onInput$` emits the current text as a string on every user
edit - typing, pasting and clearing by editing - and never a parsed number, `NaN` or `Infinity`.
The consumer decides whether the text is blank, unfinished, invalid or an accepted finite number,
which decimal and grouping conventions it accepts, and when to show an error; it drives `invalid`
and `errorMessage` in its own language. Validate the whole string before converting (a full-match
pattern, then `Number`), check the result with `Number.isFinite`, and never accept a numeric prefix
of invalid text. Blank is not zero: the field never converts one into the other. Integer-only and
whole-currency rules are consumer rules. The `EnglishParsing` and `GermanParsing` stories show one
such loop each; the library publishes no parser or locale service.

**Saved state and clearing.** `defaultValue` initialises the field on mount only; a later change
does not replace the current edit, so a mounted field keeps what the user typed across ordinary
rerenders. To restore saved text - returning to a tab, loading another record - remount the field
with the saved text as `defaultValue`. `reset$` empties the live node in place, so focus survives,
and emits nothing on `onInput$`; clear your own saved state alongside it if the field must stay
empty after a remount. Native form reset restores the form default (`defaultValue`), also silently.
Neither operation updates consumer-owned state. A disabled field accepts no edits and emits nothing,
but a `reset$` emission still clears it. Rendering, message changes and remount initialisation emit
no input events.

**Streams.** The component subscribes only to `reset$` and unsubscribes when the Subject is replaced
or the field unmounts. It only calls `.next()` on `onInput$` and never subscribes to, completes or
errors either stream; the consumer owns both lifetimes. There is no controlled `value` prop, no
live value stream and no React callback prop.

**Forms and accessibility.** The control works without JavaScript: the form submits the text by
`name`, and `required` checks presence only, so `1,5` and `twelve` both submit. Numeric validity is
not guaranteed by the form - a server must parse and validate on a no-JavaScript round-trip and
re-render the field `invalid` with its own error text, and a JavaScript consumer must itself prevent
an invalid submission. The label names the control, hint and error describe it, ids are unique per
instance, and the shared focus ring and field presentation apply in both themes. The device chooses
the actual keyboard: a decimal separator and digits are requested, but a particular layout, a minus
key or the exclusion of other characters is not promised.

## Collection

`Collection` is a vertical group of freely composed items with internal hairlines and
open outer edges. The library owns spacing and separation; the consumer owns content,
arrangement and interaction.

```tsx
import { Collection, Link, Note, Stack } from '@juwel-development/design-system';

<Collection.Root>
  <Collection.Item>
    <Stack>
      <Link href={'/guide'}>Read the guide</Link>
      <Note color={'muted'}>Supporting information</Note>
    </Stack>
  </Collection.Item>
  <Collection.Item><Note>Freely composed content</Note></Collection.Item>
</Collection.Root>;
```

Both members accept only `children?: ReactNode` and `testId?: string`. Supply
`Collection.Item` children directly, through maps, or with conditional omissions.
The semantic list has no markers, horizontal indent, added focus stops or behavior.
An empty root renders no placeholder; a single item has no rule.

`--space-collection-item` names the vertical padding inside each item, defaulting to
`1em` above and below so it follows inherited type. This is a separate role from a
Stack's sibling gap or a Section's band: re-pointing it changes only Collection item
padding. It is declared in all three token stylesheets and accepts a nonnegative CSS
length. Hairlines use the existing `--color-border` role. There are no density,
padding or arrangement props; child components own their typography and wrapping.

## ColumnLayout

`ColumnLayout` is an arrangement of weighted columns that becomes one column when the space
it is given cannot satisfy every column's minimum at the requested proportions. It owns the
arrangement and nothing else: no landmark, no band, no gutter, no fill, no scrolling. `Stack`'s
`split` keeps its own viewport-keyed contract; `ColumnLayout` answers to the width of whatever
holds it.

```tsx
import { ColumnLayout } from '@juwel-development/design-system';

<ColumnLayout.Root gap={'region'}>
  <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
    <Table.Root caption={'A&R roster'}>…</Table.Root>
  </ColumnLayout.Column>
  {selected && (
    <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
      <DefinitionList.Root>…</DefinitionList.Root>
    </ColumnLayout.Column>
  )}
</ColumnLayout.Root>;
```

`Root` takes `gap?: 'stack' | 'region'` (defaulting to `region`), `children` and `testId`. The
same gap separates the columns across the row and between the stacked lines. `Column` takes a
required positive finite `weight`, a required `minWidth`, `children` and `testId`. Supply
columns directly, through maps, in fragments or with conditional omissions; a column rendered
through a wrapping component, loose, or nested inside another column throws
`ColumnLayoutCompositionError`, and an invalid weight or token name throws
`ColumnLayoutConfigurationError`.

**Allocation.** In the row the gaps come off the Root's width and the rest is divided by weight:
`2` beside `1` is two thirds and one third of what is left. Columns align at the top and keep
their own heights. The row holds only while every share is at least its own minimum; the moment
one is not, every column takes a line of its own and fills the Root's width, a column narrower
than its minimum included. There is no partial wrap and no clamping. For `n` columns with gap
`g`, total weight `S` and minimums `mᵢ`, the row fits at and above
`(n − 1) × g + max(mᵢ × S ⁄ wᵢ)`; the space measured is the Root's, never the viewport's.

**Minimum-width tokens.** `minWidth` names a CSS custom property the consumer declares, never a
length or a `var()`. The name is a theme role of the product's own (`--main-column-min-width`),
not a library preset: the library ships no column-width ladder. Declare it on `:root`, on a
theme class, or on any ancestor of the Root, as a valid nonnegative CSS length:

```css
:root {
  --main-column-min-width: 28rem;
  --support-column-min-width: 12rem;
}
.dark { --support-column-min-width: 14rem; }
```

The token is read each time layout runs, so re-pointing it in a theme class or a media query
moves the threshold with it. A `rem` resolves against the document root, an `em` or `ch`
against the Root's inherited type, a `px` as written; a percentage is not a minimum. A missing
or invalid token is not a responsive configuration: the switch has nothing to compare and the
columns size from their content instead.

**What the content owns.** A column never widens for its content and adds no truncation or
scrolling. Running text wraps inside its track; content that cannot wrap needs its own overflow
contract, as `Table.Root` has. Resizing the holder never remounts a column, so focus and
state survive the switch, and reading and keyboard order are the order the columns are written.

## Theming

Colour is addressed by **role**, never by shade - `bg-primary`, `text-muted`,
`border-border`. No component contains a `dark:` class: `src/tokens.css` declares one
complete set of values under `:root` and another under `.dark`, so toggling that class
on an ancestor re-points every token underneath it.

A product re-themes the whole system by supplying its own values for the same role
names, which is what lets one design system serve several brands.

### Typography status tones

Typography whose colour is selectable accepts the general `success`, `warning`, `error`, and
`info` status tones alongside `foreground` and `muted`. This includes `H1`–`H6`, `Eyebrow`, `P`,
`Note`, and `Prose.Body`; fixed-colour members such as `Prose.Lede` and `Prose.Tail` remain fixed.

```tsx
<P color={'warning'}>Warning: patience is low and the offer gap is wide.</P>
```

A status tone reinforces status that the content already communicates: never use colour as the
only cue. Selecting one changes only the semantic text colour and does not add an ARIA role, live
region, icon, or wording. The caller remains responsible for announcement behavior when a changing
status needs it.

All four palette roles must remain at least 4.5:1 against `surface` in every theme because they can
paint normal-size and small text. They remain general roles rather than typography-only tokens, so
constraints from other carriers also apply; `error`, for example, remains Meter's depletion
endpoint and must keep that complete path at least 3:1 against `meterTrack`.

### Single-theme builds

`styles.css` and `tokens.css` carry both colour sets, so a product that ships only one
theme still emits a `.dark` block it can never remove. Two opt-in exports carry a single
theme's values in `:root` with no `.dark` block and no `dark:` variant:

```tsx
// a light-only product
import '@juwel-development/design-system/styles.light.css';
// a dark-only product
import '@juwel-development/design-system/styles.dark.css';
```

The tokens-only equivalents are `tokens.light.css` and `tokens.dark.css`. All three
variants are generated from the same palette, so they cannot drift.

### Changing the palette

`src/Theme/Palette.ts` is the single source of truth. `src/tokens.css` and its
single-theme siblings `tokens.light.css` and `tokens.dark.css` are generated from it:

```bash
npm run build:tokens
```

The generated files are committed, and a test pins each to the palette - editing the
palette without regenerating fails the suite rather than shipping stale colours.

#### Migrating a custom palette to the `scrim` role

Dialog added the required `scrim` role to `PaletteTokens`. A consumer that constructs its own
palette object of this type must add a `scrim` colour - an `rgb(r g b / a)` value whose alpha is
part of the role, `rgb(15 23 42 / 0.5)` being the shipped default. Spreading `light`/`dark` and
overriding stays valid unchanged, and a theme that only overrides the generated
`--color-*` custom properties in CSS inherits the new default without any change.

## Development

```bash
npm run storybook      # component workbench on :6006, with a light/dark switcher
npm run test           # vitest
npm run lint           # biome (use lint:fix to apply)
npm run typecheck      # tsc
npm run build          # library bundle + type declarations
```

### Structure

Components are grouped by what they do, one folder each:

```
src/<Category>/<Component>/<Component>.tsx
                           <Component>.stories.tsx
                           <Component>.spec.tsx
```

`Category` is `Arrangement`, `Interaction`, `Display` or `Layout`. Imports inside `src` are written
from the source root (`Interaction/Button/Button`), not relatively.

## Releasing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) - the type
prefix decides the next version, so `fix:` is a patch, `feat:` a minor, and a
`BREAKING CHANGE:` footer a major. A `commit-msg` hook checks this locally and CI
checks it again on pull requests.

Merging to `main` runs semantic-release, which works out the version from those
messages, writes `CHANGELOG.md`, tags the commit, publishes to npm and opens a GitHub
release with the generated notes. No version number is set by hand.

### Publishing a note

A commit body can carry a `NOTE:` footer, which puts a **consumer-facing note** into
`CHANGELOG.md` under its own `NOTE` heading. The version is unaffected - a `fix:` with a
note is still a patch - so a note never has to be dressed up as a breaking change to get
published:

```
fix(section): give the section a positioning context

NOTE: An absolutely-positioned descendant of a `Section` that used to anchor to an outer
ancestor now anchors to the section instead - silently, with no error.
```

Write one when a change alters how a consumer's existing code behaves **without** being a
breaking change: nothing they wrote stops compiling, but what it does is different. A note
is not a second subject line and not a place for implementation detail - it says what a
consumer has to know, in their terms. A commit carrying a note reaches the changelog
whatever its type prefix, so even a `chore:` can publish one.

One commit may carry several notes. Two rules keep them intact, both of them the commit
parser's: put a **blank line between notes**, or one of them is silently dropped, and keep
any `(#issue)` reference **off the last line of a wrapped note**, or the note is cut short
there and the reference is filed against the commit instead. Each note is published
prefixed with the commit's scope, so a commit whose notes span several components reads
better with no scope at all.

A real breaking change still uses `BREAKING CHANGE:`, and still forces a major. The two
keywords are not interchangeable, and the reason a third one cannot simply be added is in
the [architecture standard](./docs/agents/standards/architecture.md#release).
