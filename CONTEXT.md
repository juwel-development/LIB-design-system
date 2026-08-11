# Design System

A shared library of React primitives and the design tokens they are styled from, consumed by
several JuweL Development products. Its purpose is that one set of components can carry more than
one brand, so every look-and-feel decision is addressable by the consuming product rather than
fixed inside a component.

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
The one mark the library draws to show which control holds keyboard focus. It states keyboard
position and nothing else — never the importance of the control it surrounds — so it is one role
across every focusable primitive rather than one per variant. It is also the *only* thing that
changes on focus: a control's boundary, fill and geometry hold still, so focus reads as a mark
appearing rather than as the control thickening.
_Avoid_: Focus state, focus highlight, per-variant ring

### Components

**Primitive**:
A single component on the library's roster. Its props are its entire contract — there is no
`className` or `style` escape hatch, so anything a consumer needs to change must exist as a token
or a variant.
_Avoid_: Widget, element

**Control**:
A primitive the viewer operates — a button, an input, a textarea. Not every primitive is one, and
the distinction is what decides whether a token applies: the focus ring and the corner radius are a
control's, and a structural primitive takes neither.
_Avoid_: Interactive element, form element

**Roster**:
The closed set of primitives the library offers. A genuinely new need is added to the roster, never
hand-rolled as a styled element in a consuming product.
_Avoid_: Catalogue, component list
