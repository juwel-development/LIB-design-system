---
status: accepted
---

# A link is three treatments, and a prose link is told apart by its underline

`Link` renders an `<a>` in one of three treatments chosen by `treatment` — `prose`, `quiet` and
`label-link` — not one link with a colour prop. The contract extends the token layer with one colour
role, `link`, carrying the text contrast threshold, and three non-colour underline tokens. A prose
link is distinguished by its underline, never by hue, and the underline thickens on hover instantly.

## What the treatments are

| Treatment | Colour | Decoration | Used by |
|---|---|---|---|
| `prose` | `link` | underline at `--underline-thickness`, `--underline-thickness-hover` on hover | running text |
| `quiet` | `muted` → `foreground` on hover | none | header nav, footer, standing links |
| `label-link` | inherits `foreground` | none at rest, underline on hover | a link acting as a letter-spaced label |

The three genuinely behave differently — the split *is* the proposal. Collapsing them into one
component with a colour prop would ask the consuming product to set all three by hand on one page and
would lose the two rules below, which are not style preferences.

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
`transition-*` on the decoration, so the change is instant by construction.

## Considered options

**One `Link` with a `colour` prop.** Rejected — it is the defect the proposal exists to remove. It
conflates three behaviours, hands the distinction back to every call site, and cannot express "the
underline is not optional".

**A `showUnderline` prop on `prose`.** Rejected. The underline is the only thing that tells a prose
link apart, so a prop to remove it is a prop to break the link, dressed as a preference.

**Transitioning the underline thickness** so the hover growth eases in. Rejected: it animates a size,
which ADR 0001's allowlist forbids, and `transition-colors` cannot express it regardless.

**A per-instance colour, size or decoration prop, or a fourth treatment.** Rejected as out of scope:
the roster is closed and the three treatments are the whole contract. A genuinely new need is a new
treatment argued on its own, not an escape hatch.

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

**`Button`'s `ghost` variant is left alone.** It uses `hover:underline` today and is not migrated to
the new underline tokens — that is a separate change, out of this issue's scope.
