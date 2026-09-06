---
status: accepted
---

# Meter depletion is a treatment, not a colour input

`Meter` exposes a closed `neutral | depleting` treatment rather than a caller-supplied colour or a
fixed warning tone. Neutral states the level with the `meterFill` role. Depleting means that nearing
the minimum is increasingly erroneous: it maps the Meter's normalized level linearly through a
perceptual colour space, from `meterFill` at the maximum to `error` at the minimum. The treatment is
opt-in because a low value is not harmful on every scale, and the consumer remains responsible for
making that consequence understandable without colour.

## Considered options

**A raw colour prop.** Rejected. It would reopen the component's styling surface, bind call sites to
one brand's palette, and make the token contract unable to guarantee contrast.

**A fixed neutral or warning tone selected by the caller.** Rejected. It would force the consumer to
invent a threshold and make the visual change abrupt, although the measured level changes
continuously.

**An always-depleting Meter.** Rejected. Some quantities become safer rather than more urgent as they
approach their minimum, so the interpretation has to be explicit.

**A matching treatment for urgency near the maximum.** Deferred. No concrete consumer evidence
attests that direction yet; it can be proposed when a real use case names it.

## Consequences

`meterFill` and `meterTrack` become distinct palette roles even when their shipped values initially
match existing roles. The filled share, including every colour produced by depletion, must remain at
least 3:1 against the track. A persistent `rule` outline identifies the whole capacity against the
surface. Depletion adds no wording, icon, pattern, threshold or animation; surrounding consumer
content carries the non-colour explanation of why approaching the minimum matters.
