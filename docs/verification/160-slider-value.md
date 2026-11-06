# #160 Optional visible Slider value

Authority: the Agent Brief on [issue #160](https://github.com/juwel-development/LIB-design-system/issues/160)
and the "Optional visible Slider value" entry in docs/adr/0008. No GitHub posting or board changes
were performed. This is an unpublished implementation, not a release; the version is recorded on
the issue only after the normal release process ships it.

## Surface

`visibleValue?: string` on `ISliderProps`, shown in the consumer's wording on the label row. The
label stays the only accessible name. The shown wording is `aria-hidden` and reaches assistive
technology once, through `aria-valuetext` (`valueText ?? visibleValue`). Omitted, the label is
rendered exactly as before: same element, same classes, no `aria-valuetext` of its own. The range
input stays mounted across value, wording and show/hide changes.

## Browser evidence

`scripts/browser/slider.mjs` (Playwright 1.64.1 Chromium 156.0.8078.4, against `storybook dev`)
runs every check in light and dark, each against the source stylesheet, `dist/styles.css` and the
themed `dist/styles.{light,dark}.css` after `npm run build`:

- 525px and 845px holders, English and German currency and percentage ("$3,542", "34%",
  "3.542 $", "34 %"): label and value share one line, the block is 25.5px tall like the
  label-only block beside it, the control starts at the same offset, nothing overflows.
- A 200px holder with a long German label and an unbreakable 33-character figure: the value wraps
  below the label over three lines, stays inside the holder, is not clipped and has no ellipsis.
- Chrome's native accessibility tree (CDP `Accessibility.getFullAXTree`): every slider's name is
  exactly its label, with no description and no live region. The shown wording is not exposed as
  text. Through keys (ArrowRight, End, Home) and a pointer click, the same input node keeps the
  name "Weekly Wage in $" while value and wording follow the consumer.
- The label-only default renders only "Level", with no `aria-valuetext`. Disabled stays inert.

## Limits

- Chrome's CDP tree reports `valuetext` as the bare number for any range carrying
  `aria-valuetext`, including a hand-written `<input type=range aria-valuetext="forty percent">`
  in both the bundled Chromium and Chrome stable 156.0.8078.80. The announced wording is therefore
  verified from the DOM attribute, not from the engine's tree. This is a tooling limit, not a
  Slider defect.
- No screen reader (VoiceOver, NVDA, JAWS) was run. WebKit and Firefox accessibility trees were
  not inspected.
- `visibleValue=""` is passed through as given, like `valueText=""`: the library does not replace
  or normalise consumer wording.
