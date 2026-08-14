---
status: accepted
---

# A typography token contract of roles, filed ahead of the components that need it

The library declares sixteen typographic tokens — two family roles, six type roles with their
leading, a reading measure in two widths, and two tracking roles — and reads none of them yet. Six
proposals are specified in a vocabulary the token layer could not previously speak: it declared
colour, motion, focus-ring and radius and nothing typographic, so a proposal whose central
requirement is *"size is a token reference, never a local choice"* could only be approximated. The
contract exists so those components can be built against a name rather than a hard-coded literal — the
defect [ADR 0001](./0001-motion-token-contract.md) and [ADR 0003](./0003-radius-token-contract.md)
removed for motion and radius, applied before rather than after the fact.

The tokens carry no face. Both families default to `inherit`, so the library ships no binary, no
`@font-face` and no opinion about any typeface; naming a role whose value is `inherit` is a slot that
resolves to whatever the consumer already had, not a choice made on their behalf.

## Where the type-agnostic line falls

The test is whether the library *sets* the property. Where it does — size, leading, tracking, measure,
all set per element inside a sealed CVA recipe with no `className` reachable from outside — a consumer
overriding it has to fight a utility class on an element they cannot reach, so the value needs a name.
Where it does not, nothing is being fought and a name would be dead weight. Family is the one case the
library chooses whether to set at all; it sets it, so it names it (see below).

## Roles, not rungs

[ADR 0003](./0003-radius-token-contract.md) rejected a radius scale because *"a scale invites each
component to pick a rung, which is how a library ends up with five corner radii and no rule about which
one means what."* That argument is not discharged by typography needing more than one value — it is
discharged by these naming **roles, not sizes**. `--text-display` is not "the big one", it is the
page's single scale event; `--text-label` is the letter-spaced eyebrow device. There is exactly one
role per job, so a component has nothing to choose between: it asks for what its text **is**, the same
move the palette makes offering `primary` instead of `violet-500`. A `sm`/`md`/`lg`/`xl` ladder would
reintroduce exactly the rung-picking that ADR forbids.

## Amended: a third heading role, and `--text-display` corrected

This ADR first shipped **five** type roles with `--text-display` at `clamp(2.25rem, 5vw, 4.25rem)`.
Both were wrong, and the grilling on [#30](https://github.com/juwel-development/LIB-design-system/issues/30)
— which concluded after the contract had already been built — corrected them together. The
implementation was faithful to the contract as filed; the contract was what changed.

`subtitle` is added as a third heading role, so there are now **six** type roles.
[ADR 0005](./0005-heading-level-fixes-type-role.md) binds each heading level to exactly one type role
with no size prop, and depot-tracker demonstrates three distinct heading steps above body (`6xl` /
`4xl` / `2xl` against a `base` body) for levels one to three; the contract declared two. Levels four
to six do not need roles — they share the body size and separate by weight — so this is one new role,
not three. It is not a re-opening of *roles, not rungs*: `subtitle` names a job the way `display` and
`title` do, there is still one role per job, and no component gains a choice between them.

`--text-display` held `clamp(2.25rem, 5vw, 4.25rem)` — which is
[#18](https://github.com/juwel-development/LIB-design-system/issues/18)'s measured *subpage head*, a
value that must never out-scale the homepage hero. It sat one rung too high. So `display`, the hero,
moves up to `clamp(3rem, 7vw, 6rem)`; the old `display` value drops to `--text-title`
(`--leading-title` tightening from `1.15` to `1.1`); and everything the old `title` described moves
down to the new `--text-subtitle` (`clamp(1.5rem, 3vw, 2.25rem)`, leading `1.2`). The two changes are
one change: the scale shifts down one rung and gains a hero at the top.

### A lede role, for the reading block

`lede` is added as a **seventh** type role — `--text-lede: 1.25rem`, `--leading-lede: 1.4` — for the
opening paragraph of a measure-bounded reading block
([#21](https://github.com/juwel-development/LIB-design-system/issues/21)). It sits above `body`
(`1.0625rem`) and below `subtitle`'s clamp floor (`1.5rem`), with **running-text leading**: tighter
than `body`'s `1.6`, but not a heading's `1.2` — it is a multi-line paragraph, not a head.

Reusing `subtitle` was available and free, and rejected. This contract binds every size to its
leading, so borrowing `subtitle`'s size welds the lede to H3's *and* applies a heading's `1.2` leading
to running text. It is a role, not a rung, by this ADR's own test: a lede is a job — the one opening
paragraph of a reading block — so there is still one role per job and no component gains a choice
between them. Recorded here, in place, rather than as a new ADR, following the `subtitle` precedent
above.

## The measure is in `ch`

The reading measure is `66ch`, not a `rem` width. A `rem` measure holds the column still while the
thing it exists to control — the character count — moves under it: the same `34rem` ran 76 characters
at a 17px body and 71.8 at 18px, crossing the 45–75 band with nothing about the measure having
changed. `ch` is anchored to the face's zero-width, so the character count is what is held.

The trade-off is real and belongs here: `ch` depends on a face the library does not own, so a consumer
swapping to a wider face changes the physical column width. That is the correct failure — character
count is the quantity reading tolerance is defined in, and it is the one that stays right. The
alternative, shipping the measure paired with the body size it was derived against, is a two-token
coupling the contract can state but nothing can check; the `ch` unit makes the coupling automatic.
`--measure-display` is narrower than `--measure` — 36ch against 66ch — because bigger type wants fewer
characters per line, not more.

## Two tracking roles that must not collapse

An optical tracking correction and a letter-spaced label are different quantities that happen to share
the `letter-spacing` property. A site-wide optical curve — which correctly tightens display sizes and
loosens small ones — was applied across a page's text and silently collapsed a label's `0.14em` to
`0.029em`, deleting the one device whose entire job is to be letter-spaced, with no error. So the two
are named apart: `--tracking-label` is a fixed style that does not vary with size, `--tracking-optical`
a correction that does and is meaningless on its own. This is [ADR 0002](./0002-focus-ring-token-contract.md)
run in reverse — there four ring tokens collapsed to one because they encoded a distinction that did
not exist; here one property carries two quantities that do, and the fix is to name both.

*(This token shipped as `--tracking-display` and was renamed in the amendment below.)*

## Amended: the correction is size-scoped, and its name now says so

The section above named the correction after the `display` role and left **who carries it** unwritten.
Nothing then carried it, and the gap closed the worst way: `PageHead` shipped with the correction on
its `title`-role heading while `H1`, the largest type in the system, went without — inverting the
correction's own logic and rendering one type role two ways, since `H2` binds to `title` too. It
reached `main` through a clause in an agent brief, which is precisely the *"settled as a side effect of
one component's recipe"* outcome [#57](https://github.com/juwel-development/LIB-design-system/issues/57)
was filed to prevent.

**The correction is scoped by size, not by role.** It is carried by the `title` role and above — `H1`,
`H2` and `PageHead`'s `h1` — and by nothing below it. Two consequences are worth stating because they
are what the tests now pin:

- **A role reads one way wherever it is rendered.** `H2` and `PageHead`'s `h1` are both the `title`
  role, so they carry the same correction. This is [ADR 0005](./0005-heading-level-fixes-type-role.md)'s
  premise applied to a property it did not originally mention.
- **The subtitle role is the floor**, and `H3`'s spec pins it. An optical correction reaching ordinary
  type is the failure this ADR already records, one rung earlier.

**The token is renamed `--tracking-optical`.** Naming it for the `display` role was accurate while
nothing used it and became under-inclusive the moment the scope was settled — a name saying `display`
while the token serves `title` invites exactly the drift the section above warns about. `optical` names
the *kind* of quantity instead, so the pair reads as **a style and a correction** without the ADR in
hand, which is the distinction the whole section exists to protect. `--tracking-tight` was rejected: it
names the effect and loses the reason.

This is a **breaking change to the published token contract** — a consumer re-pointing
`--tracking-display` silently loses the override — and it ships as a major version rather than quietly.
That cost was accepted because the alternative is a permanent mismatch between a token's name and its
scope, in the one place in this contract where a name being read carelessly has already caused damage.

## Amended: `display ≥ title` is a default, not a contract on the consumer

The amendment above moved `--text-display` up off *"a value that must never out-scale the homepage
hero"*. That phrasing, read out of context, sounds like a rule binding any page's tokens. It is not.
It describes the relationship the library's own default values hold, and the test that guards it in
`renderTokens.spec.ts` checks only those shipped values — *"enforced against the library's own
values, never against a consumer's"*, the shape every constraint in this contract takes. No
component compares the two tokens at runtime: `H1` reads `--text-display`, `H2` and `PageHead` read
`--text-title`, each independently, so nothing breaks when their order is reversed.

`display ≥ title` holds because the hero is assumed to be a **text** scale event, and a text-led
hero should out-scale a subpage head. That assumption is a consumer's to make, not the library's. On
a site whose first-screen scale event is a **drawn mark** — an inline-SVG wordmark, not text — the
largest *text* on the home page is deliberately small: a one-line lead that must not compete with the
mark, ~31px, while the subpage head (the `title` role) is that page's single scale event, set larger,
up to ~68px. Such a consumer re-points `--text-display` **below** `--text-title` on purpose. That is
sanctioned: it inverts a default, not a contract, and breaks nothing.

So `display ≥ title` is the library's shipped default and the expectation for a text-led hero, and
the test protects that self-consistency so the display/title swap the amendment above records cannot
regress. It is not a constraint on what a consumer's re-pointed tokens may render.

## Two family roles

`--font-primary` is the face content is set in, `--font-secondary` the face labels are set in, and the
assignment is fixed by the library. Both default to `inherit`, which is what makes the pair cost
nothing: `font-family: inherit` is a genuine no-op against not setting it, so a one-face consumer sees
exactly what they see today, and a two-face consumer re-points two names and the split lands
everywhere at once. Reading both is what makes the pair live rather than decorative — a contract naming
only the departing face would strand the consumer whose *body* is the labelling face and who wants
content set in the other one.

**Considered and rejected: a `font` prop** (`<SpecTable valueFont="secondary" />`). It passes the
component-authoring standard's §2 literally, since `"secondary"` is a token name, but fails the stance
underneath it: `CONTEXT.md` opens with *"every look-and-feel decision is addressable by the consuming
product"* — through the theme, once, for the whole system. A prop makes it addressable per instance,
so two tables on one page could disagree about which face their values take and the theme would have no
say. Which face a value cell takes is a property of the design system, not of the individual table —
the shape [ADR 0002](./0002-focus-ring-token-contract.md) rejected for per-variant rings. The token
gives the consumer the same control system-wide, which is the stronger version.

**Considered and rejected: one token for the departing face only** (`--font-label`). Tighter, and the
better name — one role owning `--text-label` and `--tracking-label` too. Rejected for the stranding
case: it can express *"labels depart from the body face"* and cannot express *"content departs from the
body face"*, and nothing about a two-face system says which a given product is doing.

`primary`/`secondary` are ordinal where the rest of the contract is purposive, which is the honest
objection to them. It is answered by the palette already carrying `--color-primary`/`--color-secondary`
as roles, and by the alternative being worse: `--font-reading`/`--font-labelling` presumes which face
does which job, and a product whose grotesk sets its body and whose serif sets its labels would hold
two tokens whose names are lies.

## Constraints published on the tokens

In the shape [ADR 0002](./0002-focus-ring-token-contract.md) established: stated numerically on the
token, enforced against the library's own values, never against a consumer's.

- **`--text-label` ≥ 13px**, and **`--text-small` ≥ 15px** where it sets tabular figures. Below those
  the label's tracking reads as damage and column-against-column figure comparison stops working. Both
  are checked against the library's own rendered values by `renderTokens.spec.ts`, the way the contrast
  test in `Palette.spec.ts` checks the ring — the enforceable half of the contract.
- **`--font-primary` must carry `tnum`, `--font-secondary` must carry `smcp`**, before any component
  sets `tabular-nums` or `small-caps`. `font-variant-numeric` and `font-variant-caps` are inert on a
  face without the feature and fail *silently* — figures do not line up, capitals are synthesised. The
  library ships no face, so these are constraints on the consumer's binary, stated on the token and not
  checkable here — a `token constraint the library can only state` in the domain model's terms.

## Consequences

**Typography needs a second `@theme` block, correctly namespaced.** Unlike motion, the focus ring and
radius, these are not `:root`-only: Tailwind 4's `--font-*`, `--text-*`, `--leading-*` and
`--tracking-*` are real theme namespaces, so declaring them in a plain `@theme` block generates the
`font-primary`, `text-display`, `leading-body` and `tracking-label` utilities a sealed recipe reaches.
`renderTokens.ts` could not emit them through its `@theme inline` block, which prefixes every name with
`--color-`; that is the same reason ADR 0001 and ADR 0003 routed their tokens to `:root`. `--measure-*`
has no Tailwind namespace and goes to `:root` beside radius, read as `max-w-[var(--measure)]`.

**No Tailwind built-in is re-pointed** — the rule carried over from ADR 0001. Re-pointing `--text-base`
or `--font-sans` would do to a consumer's type and faces what re-pointing `--default-transition-duration`
would have done to their motion: silently run their whole application on our values. `--text-display`
and `--font-primary` cannot, because nothing of theirs is already called that — which is why the family
tokens take role names rather than reusing `sans` and `serif`.

**No component consumes it in this ticket.** `Button`, `Input` and `TextArea` are unchanged; this is
the foundation the six blocked proposals are written against, laid before they are built.
