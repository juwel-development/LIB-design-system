# Content-rule props — `maxLength`, `pattern`, and their family on library controls

The library's controls carry no rule about what their value may contain. There is no `maxLength`,
no `minLength`, no `pattern`, and no `min`/`max`/`step` on any control, and none will be added.
[ADR 0009](../docs/adr/0009-content-rules-stay-with-the-consumer.md) is the governing rule; this
entry exists so the next request in the family meets the decision instead of a fresh triage.

## Why this is out of scope

**A content rule is the consumer's domain knowledge.** "The Label name is at most 40 characters" is
a fact about one product, which is exactly why it arrives as a parameter — a number to compare, a
pattern to match. The library states what a field *is* (its kind, and whether the submission
contract requires it — `variant`, `name`, `required`) and never carries a predicate about its value.
The tell is the prop's value: if the value *is* the rule, the prop is refused.

**The headline request was also refusal-shaped.** Native `maxLength` doesn't flag an over-length
value — it prevents one from existing: keystrokes past the cap die silently and a 60-character paste
truncates to 40 with no feedback. A screen-reader user hears nothing; a pasting user submits a value
they never saw; no error message can ever explain, because the invalid state was made
unrepresentable. This library's controls flag states in the consumer's own words — they do not eat
input. (This argument alone wouldn't refuse `pattern`, which flags politely; the ownership argument
above refuses the whole family, which is why it leads.)

**The existing surface already carries the whole need.** Judging live and flagging in the product's
own language:

```tsx
const labelName$ = useMemo(() => new Subject<string>(), []);
useEffect(() => {
  const sub = labelName$.subscribe((value) => setTooLong(value.length > 40));
  return () => sub.unsubscribe();
}, [labelName$]);

<Input
  label={'Label name'}
  name={'labelName'}
  onInput$={labelName$}
  invalid={tooLong}
  errorMessage={'Label names are at most 40 characters.'}
/>;
```

On a no-JS round-trip the server judges on submit and re-renders the field `invalid` — the recipe
paints a server-rendered invalid state identically to a browser-flagged one. And the guarantee that
an invalid value cannot get through lives at the product's own boundary, the only place it could
ever be a guarantee: no browser-side attribute stops a crafted request. A spec written as "an
over-length value must not be able to exist in the field" is better rewritten as "must not be able
to be *submitted*".

## What would change this

Little, deliberately — the refusal is by design, not by evidence, so more call sites wanting caps or
patterns change nothing. What it does **not** cover: `variant: 'email' | 'url'` naming a field's
kind (the kind's native format check comes bundled with what the field *is* — see the ADR), and any
future *visual device* such as a live character counter, which would be its own proposal argued on
its own consumer evidence. Reversing the rule itself means amending ADR 0009.

## Prior requests

- [#95](https://github.com/juwel-development/LIB-design-system/issues/95) — "Input cannot cap its
  length, so an over-length value can exist in the field" (`maxLength?: number` on `Input`)
