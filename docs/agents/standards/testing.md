# Testing standard

How we test the design system. Companion to the [coding standard](./coding.md): that one says
*how* code reads, this one says *how we prove it works*.

## The stance

1. **Test-driven, always** — the failing test comes first (red → green → refactor). No production
   code exists that a failing test didn't demand.
2. **Test behaviour, not internals** — assert on what a consumer can observe: rendered output,
   roles, attributes, emitted values. Never on a class string, a variant name, or internal state.
3. **A component is tested through the DOM it produces**, using the same queries a user's
   assistive technology would resolve.

## The runner

Vitest with `jsdom` and `globals: true`, `@testing-library/react` for rendering, and
`@testing-library/jest-dom` matchers registered in `vitest.setup.ts` (the `/vitest` entry point, so
`toBeInTheDocument` type-checks as well as runs).

| Command | What it does |
|---|---|
| `npm run test` | The suite, once. |
| `npm run test:coverage` | The same, with v8 coverage over `src`, excluding stories and specs. |

There is **no browser-driver level here**. This package ships primitives, not flows; a real
end-to-end test belongs in the application that consumes it.

## Location and naming

- **Colocated.** `Button.spec.tsx` sits beside `Button.tsx` in the component's own directory —
  the component, its tests, and its stories are one unit. A spec that covers a root-level config
  rather than a component colocates the same way, at the root beside it: `release-notes.spec.ts`
  sits next to `.releaserc.js`, and `vitest.config.ts` includes the root for it.
- **Name tests as behaviour sentences** — `it('stays a plain button by default, so it cannot
  submit a form by accident')`, not `it('sets type')`. The sentence should say why the behaviour
  matters where that isn't obvious.
- One `describe` per component; prefer flat `it()` inside it.
- **Arrange–Act–Assert**, one behaviour per test.

## Querying

- **Query by role first** (`screen.getByRole('button')`), then by accessible text. Reach for
  `getByTestId` only when neither can express it — a component that can only be found by test id
  is usually a component with an accessibility problem.
- `testId` exists as a **consumer's** e2e hook, not as this suite's default handle.
- **Never assert on the class string.** `expect(button).toHaveClass('bg-primary')` pins the recipe's
  implementation, not the component's behaviour; a Tailwind rename then breaks a green test for no
  user-visible reason. Assert the behaviour the class produces, or leave it to the story.

## What each kind of code needs

- **A component** — its default rendering, each variant it exposes that changes behaviour (not
  merely appearance), its disabled/interaction states, and its accessible name. An interaction prop
  is proven by emitting into it and observing the effect: subscribe to the `Subject`, act, assert
  it fired.
- **The palette** — `tokens.css` is pinned to `renderTokens()` by a test, so a palette edit that
  was never regenerated fails the suite. Keep that test; it is the only thing standing between an
  edited `Palette.ts` and a stale shipped stylesheet.
- **Pure helpers** — called directly, no rendering.

## Test doubles

Barely needed here, and that is the point.

- **Fake at the interface.** Where a consumer-owned boundary interface exists, supply a small
  hand-written implementation rather than a stubbed method.
- **Mocking libraries only at genuine external boundaries** you don't own. Never for your own
  code: if your own code is hard to fake, the seam is wrong.
- **No shared mutable fixtures.** Fresh state per test, from a factory function that takes
  overrides, so a test states only what it varies. No `beforeEach` mutation.

## Stories are not tests, and are not optional

Every component has a `.stories.tsx`. It is the visual and accessibility surface — the a11y addon
runs against it — and it is how a reviewer sees a variant without building a consumer app. A
variant that exists in the recipe and in no story is undocumented.

## Coverage and done

- **No coverage target.** Coverage is a diagnostic you read — an uncovered line asks "why is this
  untested?" — not a gate you satisfy.
- A change is **done** when: its behaviour was driven by a failing test first, `npm run lint`,
  `npm run typecheck`, and `npm run test` are green (the pre-commit hook runs all three), every new
  variant has a story, and any palette change has been regenerated.
- **A bug fix starts with a failing test that reproduces it** — regression-first, same red → green.
