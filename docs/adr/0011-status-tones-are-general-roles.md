---
status: accepted
---

# Status tones are general roles with positional constraints

`success`, `warning`, `error` and `info` are one family of **status tones**: colours that reinforce
status independently of the carrier that renders them. Every typography surface that already lets
the caller select a colour exposes all four roles, and using one changes only colour — it adds no
ARIA role, live region, icon or wording. The content must communicate the status without colour.

## The contract

Every status tone must remain at least 4.5:1 against `surface` in each shipped theme. That threshold
is the normal-text floor rather than the large-text allowance because the same role is available at
every existing selectable type role, including body and small text. A consumer re-pointing the
palette inherits the same constraint even though the library cannot enforce values outside the
shipped themes.

Status tones remain general roles rather than typography-only colours. A carrier may impose an
additional positional constraint: `error`, for example, remains the endpoint of Meter's depletion
treatment and must also keep the entire depletion path at least 3:1 against `meterTrack`. Constraints
accumulate; satisfying one use does not discharge another.

The light palette moves the roles that do not meet the text floor to darker values:

| Role | Previous | New | Contrast against light `surface` |
| --- | --- | --- | --- |
| `success` | `#10b981` | `#047857` | 5.484:1 |
| `warning` | `#f59e0b` | `#b45309` | 5.022:1 |
| `error` | `#d63384` | unchanged | 4.501:1 |
| `info` | `#06b6d4` | `#0e7490` | 5.358:1 |

The dark values stay unchanged; all four already exceed 8:1 against the dark surface.

## Considered options

**Expose only `warning` on `P`.** Rejected. A status tone is independent of type role, and ADR 0008
evaluates a token-selecting position rather than granting different meanings to the same selector on
each component. Restricting the new role to the first evidenced carrier would make typography's
existing colour selector inconsistent and break the deliberate parity between `P` and `Prose.Body`.

**Add a warning-text primitive.** Rejected. Warning is a colour role, not a type role or a new text
device. A separate primitive would duplicate existing typography solely to fix one colour.

**Introduce `warningForeground` and preserve `warning` for a future fill.** Rejected. No warning fill
is attested, so a second role would anticipate a job that does not exist and leave the original role
ambiguous. Existing `error` already shows the coherent alternative: one general role may serve more
than one carrier when it satisfies every carrier's constraints.

**Attach alert semantics to status-coloured typography.** Rejected. Typography cannot know whether
the content was present initially, changed during interaction, or should interrupt the viewer. The
caller or a component that owns a status event remains responsible for announcement behavior.

## Consequences

- The existing `color` selector on `H1`–`H6`, `Eyebrow`, `P`, `Note` and `Prose.Body` gains
  `success`, `warning`, `error` and `info` alongside `foreground` and `muted`.
- Typography members whose colour is fixed, including `Prose.Lede` and `Prose.Tail`, gain no new
  selector; opening one would be a separate contract decision.
- Tests cover every selectable typography surface, the absence of added accessibility semantics,
  and the 4.5:1 palette constraint in both themes. Public documentation states when status tones are
  appropriate and that content cannot rely on colour alone.
- The light `success` change intentionally updates Form's sent-state appearance. Existing `error`
  rendering and Meter's endpoint value do not change.
- This ships as an additive, non-breaking enhancement. The palette adjustments are not announced or
  versioned as breaking changes.

