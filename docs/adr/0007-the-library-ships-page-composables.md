---
status: accepted
---

# The library ships page composables

The package is a full design system, not only a set of primitives and the token layer they are
styled from. **Page composables** — components that own an *arrangement* of primitives rather than a
single element — are in scope. A composable is held to the same contract as a primitive: a closed
prop surface, design-system vocabulary only, styled from tokens, on a closed roster reviewed per
entry.

## What changed

Until now the package was primitives plus the token layer, on the premise that composition belongs
to the consuming product — there is no application here to hold it. Several page-level proposals
(Section, Header, Footer, PosterFold, PageHead, Rail) were triaged against that premise and would
have been declined by it. **The premise is what changed.** The library is to carry page composition
too, so those proposals are triaged on their merits rather than turned away at the door.

The change widens what may be built. It does **not** widen the standard it is built to.

## The trade-off is real, not nominal

A primitive owns an element; a composable owns an arrangement — and arrangement is the thing brands
differ in most. A header that fixes *"three nav items, and no CTA button"*, an index rail that
*"numbers 02–06 and has no 01"* because that product's hero is a poster: each is a single brand's
furniture wearing a component's clothes. A composable that fixes an arrangement is therefore
materially harder to make brand-neutral than a primitive, because the arrangement itself is the
opinion.

So the bar is the same but the work is more: before a composable ships, every single-brand rule in
its proposal has to be converted into a **variant or a token**, or dropped. A composable that carries
only one brand does not ship, exactly as a primitive that hard-codes one product's colour does not.

## What is still out: brand assets

Widening scope to arrangement does **not** admit brand assets. A wordmark, a logo, a photograph of a
named person cannot carry a second brand at all — there is no variant or token that makes one
product's logo serve another's page. Hosting one product's asset in a library several products share
remains wrong for the same reason it always was, and this ADR does not change it. The brand-neutral
*general* versions of those needs (a slot a consumer fills, a role rather than an image) are pursued
separately as their own components; the asset itself stays with the consumer.

## Considered options

**Keep the package primitives-only** and let each product compose pages itself. Rejected: the design
system is meant to carry more than the smallest unit, and six proposals show the demand is real.
Leaving composition wholly to the consumer re-hand-rolls the same page furniture in every product —
the duplication the roster exists to prevent, one level up.

**Admit composables but relax the authoring rules for them**, since arrangement is hard to keep
brand-neutral. Rejected: relaxing the rule where it bites hardest is where a shared library turns
into one product's theme. The closed prop surface, one recipe per painting component, no `className`,
and tokens-not-measurements all apply to a composable verbatim. If a proposal cannot meet them, it is
not ready, not exempt.

**Admit brand assets along with composables.** Rejected — see above; an asset cannot be made to
carry a second brand, so it cannot live in a shared library.

## Consequences

- **The roster stays closed and is still reviewed per entry.** Widening the *kind* of thing that may
  join it does not open it: a composable is added deliberately, argued on its own, or hand-rolled in
  the product instead — never both.
- **Each blocked proposal owes a conversion pass.** Its single-brand rules become variants or tokens
  before it ships; that pass is where the trade-off above is paid.
- **The vocabulary gains a sibling to Primitive.** `CONTEXT.md` names the composable — a component
  that owns an arrangement — apart from the primitive that owns an element, and widens the Roster and
  the opening description to cover both without loosening "closed".
- **The standards are brought into line.** The architecture standard no longer claims composition
  lives outside the package (it keeps the consumer-agnostic half, which is the whole point), and the
  component-authoring standard's closed-roster clause admits composables.
- **What the package exports today is unchanged.** This ADR is a scope and documentation decision; no
  composable ships with it.
