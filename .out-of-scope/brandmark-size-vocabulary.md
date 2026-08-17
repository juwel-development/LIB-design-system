# Brandmark size vocabulary — naming the width of a consumer's mark

`Brandmark` sets no dimension, and the library names no role for how wide a mark is. There is no
`size` prop, no `--brandmark-width`, and no `fill` variant. The mark's box belongs to whoever placed
it; what the library sizes is the **slot**, not the asset.

## Why this is out of scope

**A mark's width is a fact about a drawing, and the library does not own the drawing.**
[ADR 0007](../docs/adr/0007-the-library-ships-page-composables.md) keeps brand assets consumer-side,
and a mark's width in a slot follows from its proportions — the consumer that prompted this computes
its own from the path data. `Brandmark`'s guarantee is deliberate and load-bearing: it *"sets no
colour, dimension, margin or link of its own."* A width utility is a dimension.

**The prop that was asked for had nothing to select.**
[ADR 0008](../docs/adr/0008-when-a-token-role-becomes-a-prop.md) settles this shape: a prop selecting
among token roles needs two roles independently attested in the same position, and
`--brandmark-width-chrome` / `--brandmark-width-poster` did not exist at all. Zero attested is a
refusal, and naming roles to satisfy a prop surface is exactly what that ADR forbids.

**The fallback fails on its own terms.** The proposal offered a single `--brandmark-width` plus a
`fill` value if the slot roster could not be named. But the two sites are `7.5rem` and `100%`, so one
role would need a second value immediately — the ladder [ADR 0003](../docs/adr/0003-radius-token-contract.md)
and [ADR 0004](../docs/adr/0004-typography-token-contract.md) exist to refuse. And `fill` is a width,
so it breaks the guarantee above.

**The premise was already answered.** The request read `cut` and size as two halves of one decision
split across the library and the consumer. `Brandmark`'s guidelines state the split deliberately:
*"The component renders whichever single cut it is given; which slot it is in is known by whoever
places it."* `cut` is a fact about the **asset** — which is why it is required and readable from the
DOM, so "has the reduction row been done?" is asked at every call site. Size is a fact about the
**placement**.

**The evidence could not name a roster.** Two sites, in one consumer — and at the time of filing the
library had exactly one consumer, whose mark had exactly one cut rather than the two `Brandmark`'s
guidance expects. The request conceded the point itself: *"one consumer is not a roster."*

## Where the need actually landed

This is the part that matters, and it is why the rejection is not a dead end.

The request was right that a hand-written `7.5rem` records nothing. It was wrong about which component
should record it. **The library owns the chrome's proportions even though it does not own the mark**, so
the number belongs to the slot the mark sits in:

```
--standing-min-width   /* how much of the bar the header's standing slot claims */
```

A *slot* role is legitimate where an *asset* role is not. It says how much of the bar the slot takes,
never how wide any drawing is, so a second brand with differently-proportioned mark re-points one
number and `Brandmark` still sets no dimension. That work is
[#81](https://github.com/juwel-development/LIB-design-system/issues/81), together with the same slot's
height floor.

One finding from verifying it is worth keeping, because it is not obvious and it bites anything that
tries to fill a floored box:

**A percentage width cannot resolve against an indefinite basis, so a mark told to fill a floored slot
renders at its intrinsic width instead.** Measured against a `viewBox`-only SVG with no `width`/`height`
attributes — the common shape — in a slot floored at 120px: `width: 100%` alone gave a **278.55px**
mark in a 278.55px slot, the floor not governing at all. The same mark additionally allowed to collapse
(`flex: 1 1 0; min-width: 0`) gave **120 × 16** in a **120 × 28** slot, matching a text standing
element in the same slot exactly. The rule that generalises: *a floor only governs a filling child if
that child can collapse; otherwise the child's intrinsic size wins and the floor is decoration.*

## What would change this

A mark-width **role** becomes arguable again when there is a roster to name rather than one product's
two numbers: a second brand, or one brand that has done the reduction row and places two cuts in the
same slots, with values that differ per brand. That is an evidence question, not a principle — the
refusal above is of naming a measurement for an asset the library does not own, and of a prop with
nothing to select.

What would **not** change it is volume. More call sites in one product writing more literals is the
same evidence repeated; per ADR 0008 the table owed is per position, and one consumer cannot fill it.

## Prior requests

- [#82](https://github.com/juwel-development/LIB-design-system/issues/82) — "Component proposal: Brandmark: cut is required, but size has no vocabulary"
