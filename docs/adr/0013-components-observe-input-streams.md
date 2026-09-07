---
status: accepted
---

# Components may observe input streams without owning them

An Observable-valued state prop is a read-only input channel: a component may subscribe to the
values it needs and owns teardown of that subscription when the source is replaced or the component
unmounts. The consumer still owns the stream's production, completion, error and lifetime, so the
component does not validate it, attach completion or error policy, publish into it, or complete it.
Interaction outputs remain Subjects that the component only calls `.next()` on; it neither
subscribes to nor completes them. This replaces the blanket prohibition on subscribing to handed-in
props, which prevented components from consuming reactive state, while preserving the library's
deliberate Observable/Subject boundary instead of introducing React callback props.
