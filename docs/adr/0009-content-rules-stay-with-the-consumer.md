---
status: accepted
---

# Content rules stay with the consumer

A rule about what a field's value may contain — a cap, a shape, a range — never becomes a prop on a
library control. The library states what a field **is**: its kind (`variant`) and its presence in
the submission contract (`name`, `required`). It never carries a rule about what the value may say.
The tell is syntactic, so triage can apply it mechanically: **a prop whose value is the rule
itself — a number to compare against, a pattern to match — is a content rule, and it is refused.**

## The case that produced it

[#95](https://github.com/juwel-development/LIB-design-system/issues/95) asked `Input` for
`maxLength?: number`, mapped to the native attribute, on consumer evidence: a Label Setup screen
caps the Label name at 40 characters, and its spec demanded that an over-length value *must not be
able to exist in the field*. The proposal argued the prop is a content constraint like `required` or
`name` — no token, no visual value — so ADR 0008's tests do not reach it. That much is true, which
is exactly why this ADR exists: ADR 0008 governs when a *token role* becomes a prop and says nothing
about constraint attributes, so #95 would otherwise have been decided by whoever triaged it.

## The rule

Two questions separated during triage, and the line between them is the decision.

**Presence is form structure; content is domain.** Whether a field must hold *something* is a fact
about the form's submission contract — every driver needs it, the no-JS round-trip included, and the
accessibility tree announces it. Whether *forty-one characters is too many* is knowledge about one
product's domain. The library owns the form's structure and does not know the consumer's domain, so
`required` ships and `maxLength` does not — they were never the same kind of thing, however alike
they look as attributes on the same element.

**A kind is universal; a rule is parameterized.** `variant: 'email'` makes the browser judge the
value's shape, which looks like contraband under this rule. It is not, and the distinction is worth
stating: an email address has one definition everywhere, carried by the platform — naming the
field's kind states what the field *is*, and the kind's native conduct (its keyboard, its autofill,
its format check) comes bundled with what it is. A content rule is the opposite: it arrives as a
parameter (`40`, a regex) precisely because no two products share it. The library may name a kind;
it never carries a predicate.

**What the consumer does instead.** The existing surface is the whole answer, on both drivers:

- Live: watch `onInput$`, judge in the product's own code, drive `invalid` + `errorMessage` — in the
  product's own language, which a native browser bubble never speaks (issue #74).
- No-JS round-trip: the server judges on submit and re-renders the field `invalid`; the recipe
  already paints a server-rendered invalid state identically to a browser-flagged one
  (docs/adr/0002-adjacent comment in `Input`'s recipe).
- The hard guarantee — *an over-length value cannot get through* — lives at the product's boundary,
  the only place it could ever be a guarantee: no browser-side attribute stops a crafted request.

A spec that says an invalid value "must not be able to exist in the field" is asking for refusal;
the honest requirement is that it must not be able to be **submitted**, and that is the consumer's
boundary doing its ordinary job.

## Considered options

**`maxLength` as filed.** Rejected on conduct before ownership: the native attribute is
*refusal-shaped*. The browser eats keystrokes at the cap and silently truncates pastes — a
screen-reader user gets no announcement, a pasting user submits a value they never saw, and no error
message can ever explain, because the invalid state has been made unrepresentable. The library's
controls flag states; they do not eat input. And admitting it opens a category — `minLength`,
`pattern`, `min`/`max`/`step` — with no principle to stop at.

**"Flag, never refuse" as the rule.** Rejected as the *rule*, though its UX argument stands above.
It tests the mechanism where the real question is ownership: `minLength` and `pattern` are
flag-shaped — any value can exist and gets marked `:user-invalid` at submit — so the mechanism test
admits them, and they are content rules all the same. Judging content is the consumer's job
regardless of how politely the judge behaves.

**"The library evaluates nothing."** Rejected: it indicts `required`, whose `:user-invalid` flag
the recipe styles today. `required` does irreplaceable work — on a no-JS round-trip nothing else can
flag before submit, the accessibility tree reads it, and the `optionalLabel` device (issue #74) is
anchored to it. Deprecating it would make forms worse to serve a purity rule.

**Grandfathering `required` as an exception.** Rejected: an exception without a principle is
re-litigated at every look-alike proposal, which is the disease ADR 0008 cured for token roles. The
presence/content line keeps `required` for a stated reason, not by seniority.

## Consequences

- **#95 closes `wontfix`**, recorded in
  [`.out-of-scope/content-rule-props.md`](../../.out-of-scope/content-rule-props.md). Its consumer
  implements the flag path above and enforces the cap at its own boundary.
- **Future proposals for `minLength`, `pattern`, `min`/`max`/`step` — on these controls or any
  future one — are refused on this ground** without re-argument. The test is the prop's value: a
  predicate is a content rule.
- **`variant: 'email' | 'url'` is coherent, not an anomaly.** Naming a kind bundles the kind's
  native conduct; nothing here re-opens the variant axis.
- **`required` stays**, as presence in the submission contract, beside `name`.
- **Every consumer owns validation.** That is a real obligation placed on every product, accepted
  deliberately: live judging via `onInput$`, server-rendered `invalid` on the round-trip, guarantees
  at the backend.
- **No counter device is opened by this.** A live "34/40" affordance beside a field would be a new
  visual device arguing its own case with consumer evidence, not consolation for this refusal.
- **A known tension is inherited, not created:** on a no-JS submit, `required`'s native bubble
  speaks the browser's words, which sits uneasily beside "the library ships no wording of its own"
  (issue #74). This ADR adds no new instance of it.
- **What the package exports is unchanged.** Like ADR 0007 and ADR 0008, this is a decision and
  documentation change; `CONTEXT.md` gains **Content rule** with it.
