# Dialog content width variants

Dialog keeps its existing `extent="content"` and `extent="screen"` API. Additional
content-width variants and a new content-width token are out of scope for this request.

## Why this is out of scope

During triage of #124, the maintainer judged the current API sufficient for the
purchase and fact-review dialog need. Content extent provides a compact surface
with content-driven height; screen extent provides space for a larger workflow.
The consumer chooses the extent and owns the content and confirmation rules.

Content extent currently uses a fixed 32rem width capped to the available viewport.
This decision accepts that existing contract; it does not claim that configurable
content widths already exist or that the consumer's rendered screens were verified.
No additional sizing API or release is required for #124.

The related rule in [ADR 0008](../docs/adr/0008-when-a-token-role-becomes-a-prop.md)
requires independently attested, distinct jobs before exposing a choice among token
roles. A requested medium size alone does not establish those jobs.

## What would change this

Reconsider with a concrete dialog composition that neither existing extent serves
adequately, showing the content and available space. Any proposed selectable width
roles would also need the evidence required by ADR 0008.

## Prior requests

- [#124](https://github.com/juwel-development/LIB-design-system/issues/124) —
  "Requirement: Dialog content width variants"
