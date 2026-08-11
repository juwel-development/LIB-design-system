# Texture — procedural decorative overlays

The design system does not ship decorative surface treatments: no grain, mottle, noise, paper
texture, or procedural overlay of any kind.

## Why this is out of scope

The library exists so that one set of components can carry more than one brand, which is why
`CONTEXT.md` opens by saying every look-and-feel decision must be *addressable by the consuming
product rather than fixed inside a component*. A decorative texture cannot satisfy that, for reasons
that turn out to be structural rather than incidental.

**It has nothing a caller can set.** A texture has no content, no semantics, no children. In the
proposal that prompted this, opacity was a ceiling rather than a setting, position was fixed to
boundaries, and the tile was pinned to one definition. What remains is a component whose entire prop
surface is empty — which is a stylesheet, not a primitive.

**Its parameters are measurements, and this library names roles.** A procedural mottle is specified by
noise type, base frequency, octave count, tile size and spread. None of those can become tokens here:
[ADR 0003](../docs/adr/0003-radius-token-contract.md) rejected a radius *scale* because naming
measurements invites each component to pick a rung, and [ADR 0004](../docs/adr/0004-typography-token-contract.md)
reaffirmed it. So there is no honest way to expose the knobs — a second brand would get the first
brand's exact texture or nothing at all.

**The library has already refused decoration on this ground.** The `Elevation` entry in `CONTEXT.md`
says the library performs none on a control, *"because a raised-and-depressing material is one brand's
opinion rather than a role any brand can re-point."* A mottle is the same kind of opinion, held more
tightly.

**It needs the consuming document arranged a particular way, which a component cannot reach.** A
`soft-light` overlay only works if the surface colour is painted on the **root** element as well as
the body — otherwise the body's background propagates to the canvas and there is nothing in the
stacking context to blend against. A published component can neither enforce that nor detect it, and
a texture that silently renders as flat grey when a consumer's global CSS differs is worse than no
texture.

Cost was not the deciding factor. The proposal was ~0.8 KB of inline procedural SVG in a data URI —
no asset, no licence, no network request. It is genuinely cheap. Cheapness is not the test; fit is.

## The finding worth keeping

This is the part that outlives the rejection, and it applies to **any** future overlay, not just a
procedural one.

**Ink at noise-alpha can only darken, so it breaks text contrast silently.** Measured at a 0.20
opacity ceiling, an ink-at-alpha texture pushed muted body text to **4.54:1 and 4.45:1** — below the
[WCAG 4.5:1](https://www.w3.org/TR/WCAG22/#contrast-minimum) floor, with nothing anywhere declaring
that it had happened. Nobody tests contrast *through* a decorative layer, so the failure is invisible
until an audit.

**A zero-mean build under `mix-blend-mode: soft-light` does not have this failure mode.** Because it
lightens as much as it darkens, it holds the surface at every strength: worst *pixel* **4.62:1**, and
the floor does not break until opacity **0.397** — roughly double any sane ceiling.

The rule that generalises: *an overlay that can only darken will break a contrast floor at some
opacity nobody will test; an overlay that is zero-mean will not.* If this library ever grows a
decorative-overlay capability, that constraint belongs on it from the first commit, in the shape
ADR 0004 uses for `tnum` — stated on the contract, because it fails silently otherwise.

Two smaller traps recorded alongside it: without `soft-light` the tile renders as literal grey rather
than as texture, and the root-element painting requirement above is what makes the blend mode work at
all.

## What would change this

A texture treatment becomes worth revisiting if it can be expressed as something a consumer
re-points rather than inherits — for example if the effect reduced to one or two *role*-named tokens
whose values a theme could set, with the zero-mean constraint published on them. The rejection is of
a fixed, unaddressable surface treatment, not of the idea that surfaces may ever have character.

## Prior requests

- [#10](https://github.com/juwel-development/LIB-design-system/issues/10) — "Component proposal: Texture — a procedural edge treatment"
