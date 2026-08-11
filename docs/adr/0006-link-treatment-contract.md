---
status: accepted
---

# A link is a closed set of treatments, and a prose link is told apart by its underline

`Link` renders an `<a>` in one of a closed set of treatments chosen by `treatment` — `prose`,
`quiet`, `label-link` and `graphic` — not one link with a colour prop. The contract extends the token
layer with one colour role, `link`, carrying the text contrast threshold, and three non-colour
underline tokens. A prose link is distinguished by its underline, never by hue, and the underline
thickens on hover instantly.

## What the treatments are

| Treatment | Colour | Decoration | Used by |
|---|---|---|---|
| `prose` | `link` | underline at `--underline-thickness`, `--underline-thickness-hover` on hover | running text |
| `quiet` | `muted` → `foreground` on hover | none at rest, underline at `--underline-thickness` on hover | header nav, footer, a standing link filled with text |
| `label-link` | inherits `foreground` | none at rest, underline at `--underline-thickness` on hover | a link acting as a letter-spaced label |
| `graphic` | inherits, and sets none of its own | none, at rest or on hover | an anchor whose child is not text — a mark, an icon, a figure; a standing link filled with a mark |

They genuinely behave differently — the split *is* the proposal. Collapsing them into one component
with a colour prop would ask the consuming product to set each by hand on one page and would lose the
two rules below, which are not style preferences.

## Two rules that are not preferences

**A prose link is told apart by its underline, never by hue.** In the consuming product the link
colour measures 7.31:1 against the surface but only 2.14:1 against the body ink, so hue alone does
not distinguish it from surrounding text for anyone. The underline is load-bearing: it is in the
`prose` treatment unconditionally, with no prop to remove it. The `link` role therefore carries the
4.5:1-as-text floor ([WCAG 2.2 SC 1.4.3](https://www.w3.org/TR/WCAG22/#contrast-minimum)) rather than
the 3:1 the focus ring and control border take — the library's own values are 5.17:1 light and 7.02:1
dark, checked in `Palette.spec.ts`.

**The hover underline change is instant.** `--underline-thickness-hover` is greater than
`--underline-thickness`, but the growth is not animated: `text-decoration-thickness` is off the
transition allowlist that [ADR 0001](./0001-motion-token-contract.md) settled on
(`transition-colors` is the only permitted transition utility, which cannot express thickness at
all). Animating thickness animates a size, which the allowlist exists to prevent. The recipe sets no
`transition-*` on the decoration, so the change is instant by construction. The same holds for the
underlines that *appear* on hover under `quiet` and `label-link`: `text-decoration-line` is not on the
allowlist either, so those lines arrive instantly for the same reason and by the same construction.

## Amended: a fourth treatment, and the underline becomes the library's

This ADR first shipped **three** treatments and said they were the whole contract. It is now **four**,
and the underline tokens are no longer prose's alone. The grilling on
[#50](https://github.com/juwel-development/LIB-design-system/issues/50) settled both. The title above
dropped its count in the process: what is load-bearing is that the set is *closed*, not the number it
happens to hold, and the table is where the number is checked.

### `quiet` underlines on hover, everywhere

[#15](https://github.com/juwel-development/LIB-design-system/issues/15) asked for a footer link that
keeps `quiet`'s colour and adds `label-link`'s hover underline, arguing that the footer is the one
place a quiet link should underline *"because there is no surrounding prose to distinguish them
from"*. The argument is right and the scoping was wrong. `quiet`'s two placements are header nav and
footer links, and **neither sits in running prose** — so the job the underline does there is the same
job in both. In `prose` an underline says *this is a link, not the text around it*. Where there is no
running text it says something else: *this is operable at all*, in a region a visitor scans rather
than reads. That second job is not the footer's alone.

So `quiet` gains a hover underline unconditionally. No treatment was added for it and the hybrid #15
asked for does not exist. Header navs gain the underline too — that is the intended consequence, not
a side effect.

### The underline tokens are the library's, not prose's

`--underline-offset` and `--underline-thickness` arrived as the *prose* link's dimensions and
`tokens.css` said so. Three underlines shipped in the library and only one read the tokens:
`label-link` and `Button`'s `ghost` both used a plain `hover:underline` at browser defaults. That was
invisible while `prose` was the only tokenised line and the others never appeared in the same
circumstances. Once `quiet` grows a line, two treatments on one recipe do the same thing differently,
which is a defect rather than an inconsistency.

`quiet`'s new underline is therefore tokenised, and `label-link` migrates onto the tokens with it.
Both take **`--underline-thickness`**, never `--underline-thickness-hover`: their lines are
*appearing*, not thickening. The pair of thickness tokens names a rest state and a thickened state of
a line already on screen, and only `prose` has one. Borrowing the hover token here would take a number
whose name does not describe the job.

`Button`'s `ghost` is the one remaining holdout and is tracked as
[#52](https://github.com/juwel-development/LIB-design-system/issues/52), rather than left to someone
re-reading this document.

### `graphic`, for an anchor whose child is not text

[#14](https://github.com/juwel-development/LIB-design-system/issues/14) and
[#16](https://github.com/juwel-development/LIB-design-system/issues/16) surfaced a placement none of
the three treatments could serve: a brand mark in a header's standing link is an `<a>` wrapping an SVG
rather than text. `quiet` sets `text-muted`, which greys a `currentColor` mark; `label-link`
underlines it on hover; `prose` recolours *and* underlines it outright. What the placement needs is
the focus ring and nothing else.

Two alternatives were weighed and declined. **The placing composable styling its descendants** —
`Header` carrying a rule scoped to its standing slot — cannot work: `standing` is an opaque slot and
`Header` imports nothing, so it cannot tell a mark from a place name, and a rule that spared the mark
would strip `quiet` from the text standing link that is fully served today. **Giving `Brandmark` an
`href`** would close this one instance and leave the general defect open — an anchor around an icon, a
`Figure` or a thumbnail wants exactly the same thing — while making a mark sometimes-an-anchor, which
is two components under one name.

`graphic` sets `text-inherit no-underline` explicitly rather than carrying no class at all. The
empty-variant shape has precedent in `Brandmark`'s `cut`, but that precedent does not transfer:
`cut`'s options are empty *by design*, existing to force a call-site decision and read back from
`data-cut`. `graphic` is meant to **paint nothing**, which is a different claim — and one that holds
under a decorating ancestor only if it is stated, since a bare variant would inherit that ancestor's
line. A guarantee conditional on the consumer's DOM is not a guarantee.

**The name is the defence, and was chosen as one.** A treatment that paints nothing is an escape hatch
wearing the sanctioned shape: called `bare` or `unstyled`, it becomes what a consumer reaches for to
dodge a treatment they dislike, and the closed roster is defeated by its own newest member. `graphic`
is named for the job so that the wrong call site reads wrong to someone who has never opened this
document — `<Link treatment="graphic">Read more</Link>` is visibly incorrect in a way
`<Link treatment="bare">Read more</Link>` is not. It is deliberately a little narrower than the need:
an anchor around mixed content is not a graphic. That is the accepted price of a name that polices
itself, and a mixed-content case arriving is a reason to revisit it, not a gap to pre-solve.

### What this costs

The claim that three treatments were *the whole contract* is spent. It was always qualified — *"a
genuinely new need is a new treatment argued on its own, not an escape hatch"* — and #50 is that
argument, made once and recorded here rather than exercised quietly. But the set is thinner than it
was: `graphic` is `label-link` without its hover underline, and `quiet` and `label-link` now differ
only in whether colour is imposed or inherited. The split still holds, because the **jobs** are
distinct where the CSS is nearly identical, and naming for the job is what keeps that legible to a
caller. It holds with less room than it had. A fifth treatment should be harder to argue than this one
was.

## Considered options

**One `Link` with a `colour` prop.** Rejected — it is the defect the proposal exists to remove. It
conflates three behaviours, hands the distinction back to every call site, and cannot express "the
underline is not optional".

**A `showUnderline` prop on `prose`.** Rejected. The underline is the only thing that tells a prose
link apart, so a prop to remove it is a prop to break the link, dressed as a preference.

**Transitioning the underline thickness** so the hover growth eases in. Rejected: it animates a size,
which ADR 0001's allowlist forbids, and `transition-colors` cannot express it regardless.

**A per-instance colour, size or decoration prop.** Rejected as out of scope: the roster is closed and
the treatments are the whole contract. A genuinely new need is a new treatment argued on its own, not
an escape hatch. As filed, this option also bundled in *"or a fourth treatment"*; splitting the two
apart is the honest record, because the prop is still rejected and a fourth treatment was not — it was
admitted through this clause, which is the only door there is. See *Amended* above.

**A radius on the link**, to match the other controls. Rejected, and it is the case that split the
Control term (CONTEXT.md): a link is operated and focusable but has no box of its own, so a radius
would paint nothing. What a link takes instead is the one focus ring, which keys on focusability
rather than on control-ness — so `Link` draws the ring from the base of its recipe like every other
focusable primitive, and applies no `--radius-control`.

**Visual current-page styling on `current`.** Rejected here: `current` sets `aria-current="page"` and
nothing visual. Any visual treatment of the current page belongs to the Header, which owns the
navigation column; putting it on the link would fix one product's header opinion into the primitive.

## Consequences

**`external` is one boolean, not two attributes.** It sets `target="_blank"` and
`rel="noopener noreferrer"` together, so a link cannot open in a new tab while leaving the opener
reachable — the unsafe half is not settable alone.

**The library ships one new colour role and three non-colour tokens.** `link` joins the palette and
reaches the utilities through the existing `@theme inline` path. `--underline-offset`,
`--underline-thickness` and `--underline-thickness-hover` are not colours, so — like the focus-ring
dimensions and radius — they sit in a `:root` block only, never in `@theme inline`, and carry their
constraint as documentation on the token in the shape [ADR 0002](./0002-focus-ring-token-contract.md)
established.

**`label-link` sets no type of its own.** It inherits colour and sets no size, tracking or face, so
it does not depend on the typography contract; the label's type is the caller's to supply.

**`Button`'s `ghost` variant is left alone here.** It underlines with a plain `hover:underline` at
browser defaults, and once `quiet` and `label-link` moved onto the tokens it became the library's last
untokenised line. Migrating it is a change to a different component and is tracked as
[#52](https://github.com/juwel-development/LIB-design-system/issues/52).
