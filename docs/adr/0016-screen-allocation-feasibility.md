# 0016 — Scroll owners assess Screen allocation feasibility

Status: accepted for #151 implementation by the coordinator after measured wrapper-only failures.

Screen's CSS tracks and visible-overflow probe alone cannot establish reachability. At 1280×650,
the assembled fixture's list Body had clientHeight 0 and scrollHeight 1982 while its outer column
reported 254/254 and Shell 521/521. Native focus scrolling could not reveal the clipped control.
A viewport-height threshold or a selector in Screen for Pane internals would conceal that gap.

The private `Layout/ScreenAllocation` module is shared infrastructure, owned by Screen and the
actual scroll owners Pane.Body and bounded Table. This is an explicit exception to independent
component implementation, not permission to import sibling internals. It is not exported from the
package barrel and adds no public prop. Screen provides an instance through React context; only
body-owned Pane and bounded Table register with the nearest instance. Child-owned Pane delegates
without registering. Tabs and Stepper keep their existing direct anatomy and need no source change.
No Screen context means no registration, measurement or change to an existing owner's defaults.

Screen owns trials and release/restoration. It measures only its own heading and allocation wrappers
and asks registered participants to accept a trial. Participants measure only their own scrollport
and content. The normal usable budget is one computed content/control line with its local vertical
insets, local focus padding, and (for Table) the rendered pinned header. A `normal` line-height falls
back to its font size. Controls are measured at their normal line plus insets, not the complete height
of an arbitrarily tall wrapped control; paragraphs/images need not fit wholly. This establishes a
usable scrolling viewport, not a guarantee that any oversized item is simultaneously visible.
Hidden, empty and nonoverflowing content accepts without imposing a minimum on the actual layout.

Rejection or visible fixed-content overflow releases the whole Screen content allocation to natural
height; the enclosing Shell owns vertical overflow. A participant does not scroll or resize itself.
During a trial Screen preserves the previous natural footprint so measurement does not collapse
the ancestor's scroll range. Resize, content mutation, content load and font completion invalidate
the decision. Registrations and observers clean up on owner/distributor teardown; sibling instances
are isolated. No child replacement, forced focus or consumer-owned dimension enters the protocol.

The bounded child must still accept natural height and expose fixed-content overflow. The contract
covers the participating owners; a third-party clipping child cannot claim automatic reachability.
Reference-window fit remains a caller content obligation. Scroll offsets clamp normally when a
bounded owner becomes unbounded. The retained browser harness checks the 650px counterexample,
height sweeps, restoration, native reveal, dynamic content, selection and independent distributors.
