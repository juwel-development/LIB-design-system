# Changing field layout to fit an always-expanded filter area

The maintainer rejected label-beside-control variants, denser field treatments and additional
spacing changes as the solution to #169's console-fit request. The approved library addition is
a reusable **Collapse** component; arranging and adopting collapsible filters belongs to the
consumer.

## Why this is out of scope

The report demonstrated that the fixed filter head and selected-writer request foot leave too
little height for a usable bounded table at 1280×720. It did not demonstrate that changing the
internal arrangement of Input, NumberInput or Select is the right shared-library solution. The
proposed saving from inline labels was an arithmetic estimate, not browser evidence, and such an
arrangement can spend horizontal room needed by translated labels, controls and hints.

The maintainer instead chose collapsible filters as the UI concept and limited upstream work to
the reusable Collapse primitive. Filter labels and hints may be available when expanded rather
than simultaneously visible throughout the request task. The consumer must choose its filter
summary, preserve applied filter state and measure its actual screen after adoption. Adding the
primitive alone does not prove either locale fits, and it does not authorize weakening unrelated
consumer assertions or changing type/control sizes.

## Boundaries

This rejects the additional field-layout and density work proposed for this request, not every
future need for alternate field arrangements. A different request would need independent evidence
and fresh triage. Existing field defaults, field messages, FieldRow alignment, spacing roles and
Screen/Pane fallback contracts remain intact. General consumer-screen redesign and acceptance
verification are not deliverables of the Collapse ticket.

## Prior requests

- [#169](https://github.com/juwel-development/LIB-design-system/issues/169) — a denser arrangement
  of labelled fields and hints to retain a bounded console body at 1280×720.
