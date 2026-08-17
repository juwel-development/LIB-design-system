# Figure width role — bounding an image frame from inside the component

`Figure` names no width role and takes no `width` prop. Its image frame fills whatever container it
is placed in, and how wide that container is belongs to the page, not to the component. There is no
`--figure-width-column`, no `width?: 'column' | 'full'`, and no `max-width` anywhere in the recipe.

## Why this is out of scope

**The prop had nothing to select.**
[ADR 0008](../docs/adr/0008-when-a-token-role-becomes-a-prop.md) is the governing rule, and this is a
token-role prop by its own test: `width` carries a token, and the position is *the bound on an image
frame's width*. The roles the proposal offered — `--figure-width-column` against today's unbounded
behaviour — do not exist. **Zero roles attested is a refusal**, and the ADR is explicit that naming a
role to satisfy a prop surface is the thing it forbids:

> Naming a new role to satisfy the prop is a separate decision, argued on the role's own merits and
> never as a side effect of a prop surface.

The evidence offered was a single `w-[360px]` at one call site in one consumer. That is a
measurement, not a role, and ADR 0003 and ADR 0004 exist to refuse measurements.

**The second value was not a value.** `full` is today's behaviour — no bound at all. So the prop as
proposed offered one real option and one name for the status quo, which is the shape ADR 0008's own
amendment warns about: *"a prop that appears to select a structural alternative may be selecting
nothing at all … the question to ask before either test is whether the two options differ in anything
the viewer can see."* Here one of the two differs from nothing.

**The width was not what forced the rebuild.** This is the part worth keeping, because the proposal's
central evidence was that a consumer had reimplemented `Figure`'s `figure` wrapper and `figcaption`
character-for-character, and named two causes. Only one of them is real.

`Figure` with a caption renders a `figure` that is an ordinary block, around an `img` that is
`w-full`. So a consumer wanting a bounded figure **with its caption intact** writes:

```jsx
<div className={'w-[360px] max-w-full'}>
  <Figure src={…} alt={…} ratio={'portrait'} caption={…} />
</div>
```

and gets the bound, the caption, and the caption's treatment — nothing is rebuilt. The consumer that
prompted this reached for `Figure` *without* a caption and rebuilt the wrapper and the `figcaption`
by hand, but the reason was the **overlay**, which has to sit between the `img` and the `figcaption`
inside a positioning context around the image only. That is a genuine missing seam and it is tracked
separately. Bounding a component from the outside is what a page does; it is not a gap.

## How this differs from the Brandmark rejection

Both fail the same ADR 0008 test, and the temptation is to file them as one concept. They are not.
[`brandmark-size-vocabulary.md`](./brandmark-size-vocabulary.md) turns primarily on ownership — *"a
mark's width is a fact about a drawing, and the library does not own the drawing."* That argument has
no purchase here: the library **does** own `Figure`'s frame, draws it, and paints its backing. The
refusal here rests only on the evidence half of ADR 0008 — zero roles attested, one consumer, one
literal — which makes it the weaker of the two rejections and the likelier to be revisited.

## What would change this

A width role becomes arguable when a **second** role is attested in the same position, doing a
distinct job — two figure widths that answer different questions about the image rather than two
rungs on a ladder. Per ADR 0008 the evidence table is owed per position, so what does *not* count is
more call sites in one product writing more literals, and what also does not count is a role that
bounds something else: `--measure`, `--measure-wide` and `--measure-display` bound a paragraph, and
ADR 0008 already rejected the latter two as container bounds on exactly those grounds.

Worth noting the honest version of the need: what the consumer expressed was *"the scale event is the
lede, not the ~360 px image"* — a statement about the relative weight of two things on a page. If
that ever becomes a role, it is likelier to be a page-level one than a `Figure` prop.

## Prior requests

- [#85](https://github.com/juwel-development/LIB-design-system/issues/85) — "Figure: no width bound
  and no overlay seam, so consumers rebuild it" (the width half only; the overlay half stayed open)
