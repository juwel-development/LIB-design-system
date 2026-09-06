# Tabs disabled tabs — deferred, not refused

`Tabs.Tab` takes no `disabled` prop in its first iteration (#102). This is a **deferral**: the
maintainer expects a future capability for unavailable tabs, and a proposal for one should be
triaged on its merits rather than matched against this file as a prior rejection.

## Why it is deferred

The first iteration ships the accepted contract exactly: two to a handful of named views, every one
of them selectable, automatic activation on focus. An unavailable tab raises questions the accepted
brief did not settle — whether an unavailable tab is skipped by arrow navigation the way Sidebar's
inert entry is, whether automatic activation tolerates focus resting on something unselectable, and
what an unavailable view's marker and colour roles are. Those want their own argued entry, not a
prop added on the way past.

## What already points the way

The vocabulary for "retains its place, unavailable for selection, skipped by keyboard focus" exists:
CONTEXT.md names it **Inert entry** for Sidebar. A future unavailable-tab capability should argue
from that definition rather than from a bare `disabled` boolean.
