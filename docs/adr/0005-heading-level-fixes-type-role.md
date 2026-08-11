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

## Consequences

**Two `h1` treatments still exist, and they live in composite primitives.** A poster-style hero and a
subpage head are both `h1` at different roles. They are separate primitives on the roster, each
rendering its own heading markup at its own role, and that is the sanctioned escape valve. `H1` the
generic primitive is for ordinary page titles. The cost is that there is more than one way to render
an `h1`, so the by-construction guarantee covers the ladder rather than every heading in the codebase.

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
