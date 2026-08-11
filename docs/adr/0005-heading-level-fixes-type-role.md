---
status: accepted
---

# A heading's level fixes its type role, so the ladder cannot be inverted

`H1` through `H6` each bind to exactly one type role and expose no size prop. A level-2 heading is
the title role and cannot be asked to render as anything else. The scale hierarchy therefore holds
**by construction** — across routes as well as down a single page — rather than by every caller
getting it right.

The three sized steps are `display`, `title` and `subtitle`, for levels one to three, taken from the
type roles [ADR 0004](./0004-typography-token-contract.md) declares. Levels four to six share the body
size and are separated by weight, because nothing has ever needed a fourth and fifth distinct size and
inventing one would be the rung-picking [ADR 0003](./0003-radius-token-contract.md) rejected for
radius.

**Two amendments to that contract are outstanding**, because this decision was taken after it
shipped. `--text-subtitle` and `--leading-subtitle` do not exist yet — a three-step heading ladder
needs a third role above body, where the contract declares two. And `--text-display` currently holds
`clamp(2.25rem, 5vw, 4.25rem)`, which is the *subpage* head's measured size and belongs one rung down
at `--text-title`; the hero role needs a value clearing it. The heading primitives cannot be built
until both land.

## Why this, and not the flexibility that came before

The design this replaces is depot-tracker's, where `size` is a free nine-rung variant (`sm` … `6xl`)
and each heading merely *defaults* to a step. That lets an `H1` render at `text-sm` and an `H3` at
`6xl`, with nothing stating which pairings are legitimate.

The freedom was measured before it was removed. Across ~162 call sites of `H1`/`H2`/`H3`/`P`, **six**
pass `size`, and three of those restate the component's own default and are no-ops. The three real
overrides are all `<H1 size="5xl">`, all page titles, all shrinking `H1` from its `6xl` default in
the same direction. **Nobody ever scaled a heading up, and nobody ever inverted the ladder.**

So the entire demonstrated use of a nine-rung escape hatch was three pages independently correcting
one badly chosen default. Setting the role correctly once removes the need, and removing the prop
removes the inversion.

## Considered options

**A bounded `role` prop** — keeping a prop but restricting its values to role names rather than
rungs. Rejected. It is a smaller version of the same hole: the freedom that lets a caller pick a
role is exactly the freedom that lets a subpage head out-scale the homepage hero, which the page-head
proposal names as *"the single easiest place for that to happen — because a subpage's largest element
is judged against the rest of that page, where it looks correct."* A cross-route constraint cannot be
enforced by a per-call-site prop.

**One `Heading` primitive taking `level` and `role` separately** — the textbook decoupling, and
honest that outline position and visual scale are two different things. Rejected because it is honest
about their being two things and then guarantees no relationship between them, which is the property
worth having. It also replaces a roster a reader already knows how to use with one that has to be
explained.

**Distinguishing levels four and five by size after all**, giving every level its own role. Rejected:
depot-tracker ships no `H4` or `H5` and its application contains not one raw `<h4>` or `<h5>`, so
there is no evidence for a fourth or fifth step, and the component-authoring standard's §1 asks for
nothing speculative.

**Tokenising the weights** that separate levels four to six. Rejected in favour of literals plus this
prose, on the precedent that structure being square is *"a decision the library makes and states in
prose, not a token it exposes"* ([ADR 0003](./0003-radius-token-contract.md)). The consequence is
recorded below rather than hidden.

## Amended: one escape valve, not two — the hero's `h1` is `H1`

This ADR was written **waiting on** the two amendments its own text calls outstanding, and the
consequence below was reasoned from the contract as it stood *before* they landed. One of them landed
and dissolved half of it.

At the time, `--text-display` held `clamp(2.25rem, 5vw, 4.25rem)` — the *subpage* head's measured size
— so `H1` rendered at the subpage head's scale and a poster hero genuinely had nowhere to go. That is
why two composite primitives were promised. [ADR 0004](./0004-typography-token-contract.md)'s amendment
then moved `display` up to `clamp(3rem, 7vw, 6rem)` and **named it the hero**, which is the value this
ADR asked for when it said *"the hero role needs a value clearing it."*

So **a poster hero's lead is a plain `<H1>`.** The two `h1` treatments are now `H1` itself and
`PageHead` ([#18](https://github.com/juwel-development/LIB-design-system/issues/18)), which renders an
`h1` at the `title` role — the role this ADR binds to level *two*. **`PageHead` is the only escape
valve, and there is no second one.**

The poster hero shipped instead as `Hero`
([#17](https://github.com/juwel-development/LIB-design-system/issues/17)) — a frame holding a minimum
height and placing an opaque slot within it. It renders **no heading of its own**: what goes in it is
the consumer's composition, because a hero varies in its structure the way a footer varies only in its
contents, and there is no arrangement every brand shares. It is therefore not a heading-bearing
primitive and is not a party to this decision at all.

Nothing about the decision itself moves: a heading's level still fixes its type role, `H1`–`H6` still
expose no size prop, and the ladder still holds by construction. What changed is the count of
components needed to keep it that way.

## Consequences

**One `h1` treatment lives outside `H1`, and it lives in a composable.** A subpage head is an `h1` at
the `title` role — a separate entry on the roster rendering its own heading markup at its own role,
and that is the sanctioned escape valve. `H1` the generic primitive is for ordinary page titles and
for a hero, which share the `display` role. The cost is that there is more than one way to render an
`h1`, so the by-construction guarantee covers the ladder rather than every heading in the codebase.
*(As first written this said **two** treatments in **composite primitives** — see the amendment above
for why it is one, and note that "composite primitive" predates the **Composable** term
[ADR 0007](./0007-the-library-ships-page-composables.md) introduced.)*

**A `font-*` weight literal is permitted where a `text-*` size literal is not.** This is a deliberate
asymmetry, not an oversight, and it is written down so a later reviewer does not "fix" it. Size is
tokenised because it carries the hierarchy; weight is a literal because tokenising it was judged not
to earn three more names.

**The distinction between levels four, five, six and a paragraph is not re-pointable.** Those four
are one size apart in weight only — bold, semibold, medium, normal — so a consumer whose brand runs
lighter cannot adjust them without collapsing them together, and the lower three steps are hard to
tell apart in practice at the best of times. Accepted as the price of not growing the contract.

**Tailwind's preflight makes the weights load-bearing.** It resets `h1`–`h6` to
`font-weight: inherit`, so a heading that sets no weight is not bold — it is whatever the body is.
Levels four to six therefore *must* state their weight explicitly or render identically to a
paragraph. This is the reason the weight lever runs out at level six and a seventh level would have
nothing left to distinguish it.

**Headings and body copy share a face.** Both read the primary family role; the secondary role stays
with the label device. A consumer wanting a grotesk display face over a serif reading face cannot
express it without a third family role, which was declined for want of a demonstrated need.
