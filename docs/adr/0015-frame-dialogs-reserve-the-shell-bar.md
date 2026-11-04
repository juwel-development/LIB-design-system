---
status: accepted
---

# Frame Dialogs reserve the Shell bar

`Shell modalScope="body"` and a DOM-descendant `Dialog.Root placement="frame"` explicitly
reserve the original bar while retaining native `showModal()` modality. The bar is visible but
inert; changing placement does not make background controls or assistive navigation available.
Both owners opt in so existing consumers retain viewport placement, and content extent stays 32rem.
Consumer offsets, a duplicated bar, portals and a nonmodal surface would transfer geometry or
accessibility obligations to every application.

Shell owns a private protocol: `data-modal-scope="body"`, inherited `--shell-bar-bottom`, and
`modal-frame-measure` refresh on opening. The metric is published in layout, refreshed synchronously
before presentation (opening can precede a queued ResizeObserver notification), and observed while
open. Scope teardown removes its listener, observer and metric. Dialog consumes the boundary for
surface allocation and native backdrop paint/blur, without importing Shell internals or adding a
cross-component context. These names are implementation state, not tokens or public API.

When fixed regions leave less than one em plus Content's insets, frame placement scrolls the whole
task, including title and actions. Browser evidence at 800×320 showed that Content-only scrolling
otherwise clips the actions. Returning to sufficient height restores Content scrolling and resets
the surface scroll position. This fallback preserves reachability; it does not satisfy a consumer's
separate requirement that all task facts fit without scrolling at reference windows.
