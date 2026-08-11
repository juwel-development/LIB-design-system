# Design System

A shared library of React components — primitives and the page composables that arrange them — and
the design tokens they are styled from, consumed by several JuweL Development products. Its purpose
is that one set of components can carry more than one brand, so every look-and-feel decision is
addressable by the consuming product rather than fixed inside a component. That holds a step up as
well: a composable that fixes an arrangement must express its differences as variants or tokens, not
host one product's furniture (see [ADR 0007](docs/adr/0007-the-library-ships-page-composables.md)).

## Language

### Tokens

**Token**:
A named value the library declares and a consuming product may re-declare. Names a *role*
(`primary`, `hover`), never a shade or a measurement.
_Avoid_: Variable, setting, theme value

**Token contract**:
The set of tokens the library promises to declare and to read. Its parts are a promise to the
consumer (these names exist and re-pointing them works), a constraint on the library (a component
styles itself from these names and nothing else), and, where a value has to satisfy a rule to be
correct, a constraint on the value.
_Avoid_: Theme API, token schema

**Token constraint**:
A rule a token's value must satisfy for the component reading it to stay correct. Published as part
of the contract, so a theme that breaks it is breaking a stated rule rather than making an unlucky
choice. A constraint the library can only state, never enforce — a consumer's value is beyond its
reach.
_Avoid_: Guideline, recommendation, best practice

**Role**:
What a token is *for*, which is what a token name states. `primary` is a role; `violet-500` is a
shade, and naming a shade is what the token layer exists to prevent.
_Avoid_: Semantic name, alias

### Typography

**Type role**:
What a piece of text *is* — a page's one scale event, a title, running body copy, a label. The
library names and sizes text by role and never by measurement, so a component asks for the role its
text fills rather than picking a step on a ramp. There is exactly one role per job, which is what
leaves a component nothing to choose between.
_Avoid_: Text size, type scale step, heading size

**Heading level**:
A heading's position in the document outline, `h1` through `h6`. The level *fixes* the type role
rather than defaulting it: a level-2 heading is the title role and cannot be asked to render as
anything else. The scale hierarchy therefore holds by construction, across routes as well as down a
page, instead of depending on every caller getting it right.
_Avoid_: Heading size, heading variant, heading scale

**Eyebrow**:
A short line of small, tracked, muted type standing above the thing it files, set at the *label* type
role — and the primitive that renders it, a `p` muted by default. Named apart from "label" on purpose:
"label" already means the HTML `<label>` a text control renders, the required `label` prop on that
control, and the label type role the device reads. An Eyebrow carries no `htmlFor` and names no
control, so it is none of those — a caller writing a form reaches for `Input`/`TextArea`, which label
themselves — and the same device inside a table header, a caption or a nav belongs to whichever
component owns that element.
_Avoid_: Label, kicker, overline, Caption, small-caps

**Reading measure**:
The width running text is bounded to, counted in characters rather than in length — because
character count is what reading tolerance is defined in, and a width held still lets the count drift
as the type size moves under it. It belongs to whatever owns the reading column, never to the
paragraph inside it.
_Avoid_: Max width, line length, content width

### Motion

**Motion**:
Any change the library animates over time rather than applying instantly.

**Motion the library performs**:
Motion originating in a library component. The boundary of what the token contract may govern —
the library declares tokens for motion it performs, and stays out of motion it does not. A page
transition is motion the *consumer* performs, so it has no token here.
_Avoid_: Our animations, library motion

**Colour transition**:
The only motion the library performs — a colour change between two states of a component, of which
hover is the commonest but not the definition. Paint only: it may never move, resize, or re-elevate
the thing it is on.
_Avoid_: Hover transition, hover animation, hover effect

**Reduced motion**:
The viewer's stated preference for less animation. The library honours it by re-pointing its own
motion tokens to zero, and never by overriding motion it does not perform.
_Avoid_: Motion off, a11y motion mode

**Elevation**:
The appearance of something being raised off the surface — a shadow, or a press that shifts
geometry. On a *control* it is decoration and the library performs none, because a
raised-and-depressing material is one brand's opinion rather than a role any brand can re-point. On
a *floating layer* it is a depth cue rather than decoration, and would be expressed as a token
rather than hard-coded into a component.
_Avoid_: Depth, shadow, lift

### Focus

**Focus ring**:
The one mark the library draws to show which primitive holds keyboard focus. It states keyboard
position and nothing else — never the importance of the thing it surrounds — so it is one role
across every focusable primitive rather than one per variant, and it follows focusability rather
than control-ness: a primitive the viewer can tab to takes it whether or not it is a control. It is
also the *only* thing that changes on focus: a boundary, fill and geometry hold still, so focus
reads as a mark appearing rather than as the thing thickening.
_Avoid_: Focus state, focus highlight, per-variant ring

### Components

**Primitive**:
A component on the roster that owns a single *element* — a button, an input, an eyebrow. Its props
are its entire contract — there is no `className` or `style` escape hatch, so anything a consumer
needs to change must exist as a token or a variant.
_Avoid_: Widget, element

**Composable**:
A component on the roster that owns an *arrangement* of primitives rather than a single element — a
section, a header, a footer. It is held to the primitive's contract exactly: a closed prop surface,
tokens and variants only, no escape hatch. What sets it apart is that its subject is arrangement, and
arrangement is where brands differ most, so a composable's single-brand rules must be converted into
variants or tokens before it ships. Brand assets stay out of it: a wordmark or a named person's
photograph cannot carry a second brand, so it belongs to the consumer, never here (see
[ADR 0007](docs/adr/0007-the-library-ships-page-composables.md)).
_Avoid_: Layout, template, section wrapper, molecule

**Control**:
A primitive the viewer operates through a box of its own — a button, an input, a textarea. Not every
primitive is one, and the distinction is what decides whether a token applies: the corner radius is a
control's, and a structural primitive takes none. A link sits deliberately outside the term. It is
operated, but it has no box, so a radius on it would paint nothing; what it takes instead is the
focus ring, which keys on being focusable rather than on being a control.
_Avoid_: Interactive element, form element

**Roster**:
The closed set of components the library offers — primitives and composables alike. A genuinely new
need is added to the roster, never hand-rolled as a styled element in a consuming product. Widening
it to hold composables widened the *kind* of entry allowed, not the door: the set stays closed and
each entry is still reviewed on its own.
_Avoid_: Catalogue, component list

### Forms

**Field**:
The label, control and messages a text control renders as one unit. Not a primitive — `Input` and
`TextArea` each *are* a field, and the library offers no wrapper for composing one.
_Avoid_: Field wrapper, form group, form row

**Driver**:
Whatever performs a form's submission and carries its state — a native round-trip or a hydrated
island. The library commits to neither: it declares where a submission goes and renders the state it
is told, so a product can change driver without changing markup.
_Avoid_: Transport, submission handler, backend

**Form state**:
Which of `idle`, `sending`, `sent` or `failed` a form is in. Owned by the page, never by the
component — a component renders the state it is given and never decides which one it is in.
_Avoid_: Submission status, loading state
