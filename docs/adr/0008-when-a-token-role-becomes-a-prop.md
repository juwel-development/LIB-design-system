---
status: accepted
---

# When a token role becomes a prop

A prop that selects among **token roles** requires a second role independently attested serving a
distinct job in the same position. One attested role and the recipe fixes it; zero and the value is
refused.

A prop that selects among **structural options** — an axis, a distribution — carries no token, so it is
decided instead on whether the alternative is ever right.

The library already had a rule against turning a role into a *scale*.
[ADR 0003](./0003-radius-token-contract.md) rejected a radius scale because *"a scale invites each
component to pick a rung, which is how a library ends up with five corner radii and no rule about which
one means what"*; [ADR 0004](./0004-typography-token-contract.md) reaffirmed it for type; the spacing
roles carry the same argument in their own source comment — three names *"bound to one job with nothing
to choose between, not to a step on a ramp a component picks from"*. What no document stated is when a
role may become selectable **at all**, and *never* is plainly not the library's answer: `Link`'s
`treatment` is a closed set of named choices, argued entry by entry in
[ADR 0006](./0006-link-treatment-contract.md). So every proposal wanting a `gap`, a `size` or a
`measure` prop re-argued the same ground from first principles, and the answer depended on who triaged
it. This settles the ground once.

## The token-role test

Four terms carry the weight, and each is meant literally.

**Position** is where in the component the value lands, not which token it is. The gap between a
stack's children, the bound on a container's width, and the gap between a cluster's *wrapped lines* are
three positions. A role used elsewhere in the library in a different position is no evidence for this
one: `--space-band` being real and named says nothing about whether it is ever a gap. A position is not
per-component, though: the gap between children along a line is the same position in `Header`'s nav row
and in `Form`'s actions row, which is why either can attest for a third component that renders one.

**Attested** means some site already renders that role in that position — a recipe in this library, or
a call site in a proposal's filed evidence. A value a reader can imagine wanting is not attestation,
and neither is symmetry with a token that happens to exist.

**Independently** disqualifies a site that reaches for a role because something *else* is missing. Such
a site is evidence for the missing thing, not for the role, and counting it lets a gap in one component
open a prop on another. It disqualifies an *inherited* value on the same grounds: where one shorthand
sets two positions at once, the site chose the value for one of them and the other took it by default,
and a value nobody chose attests nothing.

**A distinct job** means the two roles answer different questions about the content, so a caller
choosing between them is describing what they hold rather than picking a size. Two roles that differ
only in how much air they produce are a ladder with two rungs.

The outcomes are the whole rule:

- **Two or more roles attested** — the prop exists, and its options are exactly the attested roles.
  Not the token family, not "the three `--space-*` roles because there are three": a role that reached
  no site does not reach the prop either.
- **Exactly one** — the recipe fixes it. There is nothing to choose between, so a prop offering the
  choice is an escape hatch with one door. A second role attested later is what re-opens it, and that
  is a change to this ADR's evidence rather than a judgement call at the call site.
- **Zero** — the value is refused. A caller asking for a value no role serves is asking for a
  measurement, which ADR 0003 and ADR 0004 already answer. Naming a new role to satisfy the prop is a
  separate decision, argued on the role's own merits and never as a side effect of a prop surface.

The test is applied per position, not per component. A component may fix one value and expose another —
that is the ordinary outcome, not a compromise.

## The structural test

A structural prop selects an arrangement, not a value: which axis a thing runs on, whether it wraps,
how leftover space is distributed, whether a bound applies at all. Nothing in it reaches the token
layer, so the ladder argument has no purchase and a different question is asked: **is the alternative
ever right?** If it is, the prop exists with named options — two or three named for the job, never the
CSS keyword set. If it is not, the component fixes the correct behaviour and offers no prop, exactly as
a component fixes a value nobody should choose.

Structural props already ship, twice: `Hero`'s `place` distributes its slot in the leftover space, and
`Table`'s `align` sets a cell's text alignment on `Cell` and `HeaderCell` alike. Both are correct and
neither could survive the token-role test, because neither carries a token to be tested.

## Why the halves stay apart

The distinction is load-bearing and is the reason this ADR is two rules rather than one. The token-role
half exists to stop the token layer becoming a ladder — it is the half ADR 0003 and ADR 0004's
reasoning reaches, and the only one. Reading it as governing *every* prop would refuse an axis prop the
library already ships twice, and would make the library's own `Hero` retroactively wrong.

Reading it the other way is the commoner error and costs more: treating a token-role choice as merely
structural — *"the caller knows how much air the page wants"* — is how three spacing roles become a
spacing scale without anyone deciding to build one.

The question to ask first is therefore not *should this be a prop?* but **does this prop carry a
token?** The answer picks the test, and the test gives the answer.

## The case that produced it: `Stack` and `Cluster`

[#75](https://github.com/juwel-development/LIB-design-system/issues/75) and
[#76](https://github.com/juwel-development/LIB-design-system/issues/76) each arrived with a prop
surface offering a role per column of their evidence tables. Worked through the test above, both shrink.

**This ADR is the later decision and supersedes those two bodies.** Where a suggested shape in #75 or
#76 disagrees with what follows, this ADR is what ships; the proposal bodies stay as filed because they
are the evidence, not the specification. Each issue's triage brief is derived from this rule rather
than from the body it sits under, so where a body and its brief differ, the brief is the specification
and what follows is why.

`Stack`'s gap has two roles attested in the same position and doing different work — `--space-stack`
separates siblings inside one block, `--space-region` separates a page region from the next. Two, so
the prop exists, and it holds those two. Its measure has one — `--measure`, the reading column — so the
recipe fixes the role, and whether the stack is bounded at all remains a structural choice under the
second test: an unbounded column is right where the children are not running text, so both alternatives
are real. Whether the column turns into a row on a wide viewport is structural in the same way — it
carries no token, and both answers are right for different content. That leaves a `gap` of two roles, a
bound that is on or off, and an axis that may change; what it does not leave is a measure to pick from.

`Cluster` keeps less, but not nothing. Its wrapped-line gap is one attested role and its alignment is
baseline at every site, so the recipe fixes both. Its inline gap keeps a prop: once `--gutter` is set
aside (below), two `--space-*` roles are attested along a line and they answer different questions.
`--space-region` separates one group from the next — `Header`'s private row, and the two footer rows in
#76's evidence that use a space token. `--space-stack` is the sibling gap between items that belong
together, which is what `Form`'s actions row renders today — `src/Layout/Form/Form.tsx` carries
`flex flex-row gap-[var(--space-stack)]`. Two roles, two jobs, one position, so the prop exists and
holds exactly those two. The other prop that survives is the distribution — `justify`,
where start and end-to-end are both genuinely right. `Cluster` fixes its wrapped-line gap and its
alignment and selects nothing else.

## Considered options

**`band` as a stack gap.** Rejected. `--space-band` is never a gap anywhere in the library; it is
vertical padding, exclusively — the air *inside* a page section. `Section`'s own guidance argues
against the idea directly: a gap between blocks *"reads as missing content"*, which is why `Section`
offers no gap and no margin, and why the levers on a page's rhythm are measure, leading and the air
within a section. The two consumer sites reaching for it sit on a page that declines `Section`
altogether, and reproduce its band of air by hand: what they want is a page unit carrying the gutter
without the band and the join `Section` couples to it. That is a site working around something missing,
which *independently* excludes, so they attest no gap role. (An earlier revision of this paragraph
described them as working around a missing `bleed` variant — see *Amendments*.)

**`--measure-wide` and `--measure-display` as container bounds.** Rejected. Both bound an individual
paragraph, never a container: `--measure-wide` is a wider *reading* line and `--measure-display` bounds
nothing at all today — `Hero` names it in prose guidance only, which is
[#87](https://github.com/juwel-development/LIB-design-system/issues/87) and is not a `Stack`. A role
that has never bounded a container is not attested in that position, whatever it bounds elsewhere.

**A `rowGap` prop on `Cluster`.** Rejected. Every site that splits its two axes uses the same role for
the wrapped-line gap — `--space-stack`, at all three footer rows in #76's evidence. `Header`'s row is
not a fourth attestation against that: it sets one shorthand `gap`, so the `--space-region` landing
between its wrapped lines was chosen for the inline axis and inherited by the other, which
*independently* excludes exactly as it excludes a site working around something missing. One attested
value, so the recipe fixes it. That the *other* axis takes a different role is what the recipe encodes;
it is not a reason for the caller to choose this one.

**An `align` prop on `Cluster`.** Rejected. Every site is baseline-aligned and none is centred. #76
argues baseline is *correct* rather than merely conventional, because these rows mix type at different
roles — nav links at the label role beside a credit line at the small role — and centring them makes
the type look mis-set. Under the structural test the question is whether the alternative is ever right,
and on this evidence it is not; a prop here would offer a caller the wrong answer in a named form.

**`--gutter` inside a space prop.** Rejected. The gutter is measured against the screen and the
`--space-*` roles against the type — `--gutter` is a `clamp()` on `vw` and the space roles are in `em`
so they track the type ramp. One prop cannot honestly range over both: a caller choosing between them
is not choosing how much air, they are choosing what the air answers to. The footer's widest row wants
the gutter deliberately, and that is a horizontal-rhythm concern the row's container owns, in the same
way `Section` and not `Stack` owns the page gutter.

**Writing the rule as one test covering every prop.** Rejected — see *Why the halves stay apart*. A
single test either refuses `Hero`'s `place` or dissolves into "argue it each time", which is the state
this ADR exists to leave.

**Leaving the rule unwritten and triaging each proposal on its merits.** Rejected. That is the status
quo, and its cost is visible: two proposals filed within days of each other proposed the same three
`--space-*` roles as prop options, neither having been asked to show a second role doing a distinct job.
A rule that lives only in reviewers' heads is re-derived, and it is re-derived differently.

## Consequences

**The rule pre-decides three open proposals.** Each turns on whether a role becomes selectable, and
each is now argued against the test rather than from scratch:

- [#82](https://github.com/juwel-development/LIB-design-system/issues/82) (`Brandmark` has no size
  vocabulary) asks for a `size` prop over roles that do not exist yet — zero attested, so the prop is
  refused in that shape. What survives is the separable half: naming a mark-width role at all is its
  own decision, and "fills its slot or does not" is structural.
- [#83](https://github.com/juwel-development/LIB-design-system/issues/83) (`Section` has no `bleed`
  variant that keeps content inset) is structural throughout — it selects no token, it separates a band
  from its content — so it is decided on whether the alternative is ever right. Asked that question in
  triage it was closed as **already implemented**: `Section` paints no background and takes no
  `max-width`, so `bleed` governs only where the content's padding sits, and the join spans the full
  element width under either value. The proposed third value renders identically to the `inset` default,
  so there was no alternative to decide on. See *Amendments*.
- [#87](https://github.com/juwel-development/LIB-design-system/issues/87) (`Hero` names
  `--measure-display` and offers no way to apply it) is a token-role prop with exactly one role
  attested in that position, so whatever ships caps at `--measure-display` from its recipe. A
  `measure?: 'display' | …` prop is not available to it.

**`Stack` and `Cluster` ship smaller than they were proposed.** As filed, #75 offered `band` inside its
`gap` and a roster of measures; it loses both. #76 offered `rowGap`, `align`, and `--gutter` inside its
`gap`; it loses all three. Both keep what the evidence carries — a `gap` holding the two attested space
roles, plus whatever the structural test earns them. An implementer of either follows this ADR where
the ticket body differs.

**A proposal now owes an evidence table per position, not per component.** "Three roles exist and a
caller might want any of them" is not an argument this library accepts; "these two roles are already
rendered here, doing these two different jobs" is. Triage may ask for that table before a proposal is
ready, and a proposal that cannot produce it is asking for a measurement.

**The vocabulary gains the Arrangement kind.** `CONTEXT.md` names an **Arrangement** — a component that
owns an arrangement and *no* page job — beside Primitive and Composable, with `Stack` and `Cluster`
under it. [ADR 0007](./0007-the-library-ships-page-composables.md) requires a composable to convert
every single-brand rule into a variant or a token before it ships; an arrangement has nothing to
convert because every value it emits is a role already named. That emptiness is the entry test rather
than a way past one, and naming the kind is what lets a reviewer tell a legitimate pass from a dodge.
`src/Arrangement/` is opened as a sibling of `Display`, `Interaction` and `Layout`, which continues to
mean "owns a page job".

**Nothing already shipped is re-audited against this.** The rule governs how a role reaches a *new*
prop surface. No existing recipe is re-opened here, and the rule declares no token: it says when an
existing role may be selected, never which roles exist.

**What the package exports is unchanged.** Like ADR 0007, this is a decision and documentation change;
no component ships with it.

## Amendments

**Two claims about [#83](https://github.com/juwel-development/LIB-design-system/issues/83) were wrong
and are corrected above.** Both assumed `Section` was missing a `bleed` value that keeps content inset
while the band bleeds. It is not: `Section` paints no background, takes no `max-width` and draws no
inline border, so `bleed` changes only the content's padding — and the join, being a border, spans the
full element width under either value, which the component's own guarantee already states. The proposed
`band` value therefore renders identically to the `inset` default, and #83 closed as already
implemented.

What changed:

- The `band`-as-a-stack-gap rejection said its two consumer sites were *"working around the missing
  `bleed` variant (#83) … #83's evidence, counted twice."* There is no missing variant, so that was the
  wrong diagnosis. Both sites are on a page that declines `Section` because it wants the gutter without
  the band and the join — which still disqualifies them under *independently*, so **the rejection stands
  on unchanged grounds**. The primary argument never depended on the diagnosis: `--space-band` is
  vertical padding exclusively and is a gap nowhere in the library.
- The Consequences bullet said this ADR *"hands [#83] the two `band`-gap sites above as further evidence"*
  that its alternative is sometimes right. It hands it nothing; there was no alternative to weigh.

Nothing in the rule itself moves. Both halves of the test, every other rejection, and the `Stack` and
`Cluster` outcomes are untouched — what was wrong was a pre-decision about one open proposal, which is
evidence rather than rule. The pre-decisions for
[#82](https://github.com/juwel-development/LIB-design-system/issues/82) and
[#87](https://github.com/juwel-development/LIB-design-system/issues/87) stand as written.

The lesson worth keeping is narrower than the correction: **a prop that appears to select a structural
alternative may be selecting nothing at all.** The structural test asks whether the alternative is ever
right and takes for granted that there *is* one. Where a component paints no surface of its own, two
values that sound different — *bleed the band, inset the band* — can describe the same rendered box, so
the question to ask before either test is whether the two options differ in anything the viewer can see.
