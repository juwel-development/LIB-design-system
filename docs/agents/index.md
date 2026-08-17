# Agents

This design system is built by agents working against a planned frontier of tickets. This
section documents the substrate those agents operate on.

- **[Issue Tracker](./issue-tracker.md)** — how issues, sub-issues, blocking, and
  dependencies work as native GitHub Issues, which board they land on, and the identifiers
  each interface wants.
- **[Triage labels](./triage-labels.md)** — the mapping from the canonical triage roles the
  skills speak to the label strings the tracker stores.
- **[Standards](./standards/)** — `coding.md`, `architecture.md`, `testing.md`, and the
  component-authoring standard. The `/code-review` Standards axis reads all four.

This tree is **tracked but unpublished**: it is the agent substrate rather than documentation for
consumers, and `package.json#files` ships `dist` and `src` only, so it never reaches anyone who
installs the package. Anything a consumer of the package needs to read belongs in `README.md` or a
Storybook doc instead.
