import { dark, light, type PaletteTokens } from './Palette';

const GENERATED_HEADER = `/* GENERATED from src/Theme/Palette.ts by \`npm run build:tokens\` - do not edit by hand.
 *
 * The raw values live in :root and .dark; the @theme inline block maps each one onto a Tailwind
 * colour so utilities resolve through the variable rather than baking a hex in. Declaring the
 * values inside @theme directly would freeze them at build time and the .dark overrides would
 * never reach the utilities. */`;

/* The library performs exactly one motion - a colour transition - so its motion contract is this
   single token. 150ms matches Tailwind's default, so it changes nothing visually; its job is to
   have a name a consumer theme and the reduced-motion query can reach.
   See docs/adr/0001-motion-token-contract.md. */
const MOTION = `:root {
  --motion-duration-color: 150ms;
}

/* Honour prefers-reduced-motion for the one motion the library performs, by re-pointing the token
   to 0ms. Deliberately no blanket transition reset - only what the library performs is zeroed. */
@media (prefers-reduced-motion: reduce) {
  :root {
    --motion-duration-color: 0ms;
  }
}`;

/* The ring's width and offset are not colours: like motion they live in :root only, never in
   @theme inline, so a consumer can re-point them. Constraint: both > 0 - a zero width is no
   indicator, a zero offset drops the ring onto the fill where the 3:1-against-surface rule fails.
   See docs/adr/0002-focus-ring-token-contract.md. */
const FOCUS_RING = `:root {
  --focus-ring-width: 3px;
  --focus-ring-offset: 2px;
}`;

/* Radius is not a colour: like motion and the focus-ring dimensions it lives in :root only, never
   in @theme inline. One token names the corner every control reads; 0.5rem is exactly what
   rounded-lg resolved to, so nothing changes visually while it keeps tracking the root font size.
   No structure radius, no value constraint - both deliberate; see docs/adr/0003-radius-token-contract.md. */
const RADIUS = `:root {
  --radius-control: 0.5rem;
}`;

/* The control's minimum width is not a colour: like radius it lives in :root only, never in
   @theme inline, so a consumer theme can re-point it. One token names the floor primary and
   secondary share; 10.5rem is exactly what min-w-42 resolved to, so nothing changes visually while
   it keeps tracking the root font size. ghost owns a distinct zero - an intentional role, not this
   token set to 0 - so it keeps its literal min-w-0 and does not read this. See docs/adr/0003. */
const CONTROL_MIN_WIDTH = `:root {
  --control-min-width: 10.5rem;
}`;

/* The library's underline is not a colour: like the focus-ring dimensions it lives in :root only,
   never @theme inline. Not prose's alone - every Link treatment that draws a line draws it from these.
   Constraint: --underline-thickness-hover > --underline-thickness (the thicken on hover is the only
   cue telling a prose link apart, never hue) and both > 0. The pair names a rest state and a thickened
   one, so only prose - whose line is always on screen - reads the -hover token; a line that merely
   appears on hover takes --underline-thickness. Either way the change is instant, decoration being off
   the transition allowlist. See docs/adr/0006-link-treatment-contract.md. */
const UNDERLINE = `:root {
  --underline-offset: 0.18em;
  --underline-thickness: 1px;
  --underline-thickness-hover: 2px;
}`;

/* Typography is not a colour and, unlike the blocks above, not :root-only: Tailwind 4's --font-*,
   --text-*, --leading-* and --tracking-* are theme namespaces, so its own @theme block generates the
   font-primary/text-display/leading-body/tracking-label utilities a sealed recipe reaches. No
   Tailwind built-in is re-pointed; only new role names. See docs/adr/0004-typography-token-contract.md. */
const TYPOGRAPHY = `@theme {
  /* Both faces default to inherit, so the library ships no @font-face and no face and a one-face
     consumer renders as today. --font-primary is carried by content, --font-secondary by labels; a
     component sets font-variant-numeric: tabular-nums only on a --font-primary carrying tnum and
     font-variant-caps: small-caps only on a --font-secondary carrying smcp - both fail silently otherwise. */
  --font-primary: inherit;
  --font-secondary: inherit;

  /* Type roles, not a scale: one role per job, so a component asks for what its text is, never a rung.
     display > title > subtitle are the three heading steps H1-H3 bind to; H4-H6 share body and split
     by weight, so there is no fourth role. display is the hero and must out-scale every subpage head. */
  --text-display: clamp(3rem, 7vw, 6rem);
  --leading-display: 1.05;
  --text-title: clamp(2.25rem, 5vw, 4.25rem);
  --leading-title: 1.1;
  --text-subtitle: clamp(1.5rem, 3vw, 2.25rem);
  --leading-subtitle: 1.2;

  /* The reading block's opening paragraph (Prose #21): sized above body and below subtitle, led
     tighter than body's 1.6 but not as tight as a heading's 1.2 - it is running text, not a head, so
     it keeps running-text leading. A role, not a rung: one lede per block, nothing to choose. Reusing
     subtitle was rejected in ADR 0004 - it welds the lede's size to H3's and its leading to a head's. */
  --text-lede: 1.25rem;  /* 20px */
  --leading-lede: 1.4;
  --text-body: 1.0625rem;  /* 17px */
  --leading-body: 1.6;
  --text-small: 0.9375rem;  /* 15px floor: below it tabular figures stop comparing column to column */
  --text-label: 0.8125rem;  /* 13px floor: below it the tracking reads as damage, not a device */

  /* Two quantities on one property that must not collapse: --tracking-label is a fixed letter-spaced
     style, --tracking-optical a correction that varies with size. The names say which is which, so the
     distinction survives without the ADR in hand. Scope: the title role and above - H1, H2 and the page
     head's h1 - and never below it, where the correction would read as damage. See the ADR. */
  --tracking-label: 0.14em;
  --tracking-optical: -0.02em;
}`;

/* The reading measure is in ch, not rem, so the character count stays held when the body size moves
   under it; --measure-display is narrower because bigger type wants fewer characters per line, and
   --measure-wide slightly wider - the standfirst of a page head (PageHead #18) is an opening statement,
   not a reading column, so it runs a little past the reading measure by design. All three in ch and,
   having no Tailwind namespace, in :root beside radius, read as max-w-[var(--measure)]. */
const MEASURE = `:root {
  --measure: 66ch;
  --measure-display: 36ch;
  --measure-wide: 72ch;
}`;

/* Three spacing roles, not a ladder: --space-stack is the sibling gap in a stack, --space-region the air
   around a region of a page - a form's region groups and the shell's bars, above and below the header and
   the footer and between the header's nav items (#14/#15) - and --space-band the vertical air inside a page
   section (#9). All three in em so they track the type ramp, not a fixed length. Three names a reader could
   line up stack < region < band is exactly where "roles, not rungs" is tested - and it holds: each is bound
   to one job with nothing to choose between, not to a step on a ramp a component picks from. A numbered
   scale (--space-1..4) was rejected for that reason - ADR 0003/0004. em has no Tailwind namespace, so like
   --measure these sit in :root. The gutter is a spacing role too but not a --space-* one and not in em -
   see GUTTER below. */
const SPACING = `:root {
  --space-stack: 0.5em;
  --space-region: 1.5em;
  --space-band: 4em;
}`;

/* The gutter is the horizontal inset holding content off the viewport edge (#9), and the one spacing role
   measured against the screen rather than the type: it answers to how much room there is, not how large
   the words are, so it is in rem/vw and never em. A clamp() lets it grow with the viewport with no
   breakpoint, the device --text-display already uses. Not a --space-* role and no Tailwind namespace, so
   it sits in :root beside the space roles, read as px-[var(--gutter)]. */
const GUTTER = `:root {
  --gutter: clamp(1.5rem, 5vw, 4rem);
}`;

/* The fold is the least height a first screen takes (CONTEXT.md): measured against the screen not the
   type, so in vh/rem and never em, in :root beside the gutter with no Tailwind namespace, read as
   min-h-[var(--fold-height)]. Constraint: the vh component is < 100vh - a fold that exactly fills the
   screen guarantees top-heaviness, so the next section's hairline must sit just inside it, and the
   floor is enforced against the library's own value (ADR 0004), never a consumer's. */
const FOLD = `:root {
  --fold-height: min(70vh, 40rem);
}`;

/* Four aspect roles in a @theme block like typography: --aspect-* is a Tailwind 4 namespace, so it
   generates the aspect-portrait utilities Figure reaches rather than a :root value. Named shapes, not
   a ladder - ADR 0003/0004 rejected a radius and spacing scale (see SPACING) because a scale lets a
   component pick a rung with no rule saying which; four shapes with distinct jobs and no ordering do not. */
const ASPECT = `@theme {
  --aspect-portrait:  4 / 5;
  --aspect-square:    1 / 1;
  --aspect-landscape: 3 / 2;
  --aspect-wide:     16 / 9;
}`;

/* The checklist tick's two dimensions are not colours: like the underline and focus-ring dimensions
   they live in :root only, never @theme inline, so a brand can re-point them. They are named rather
   than recipe literals because of ADR 0004's test - whether the library sets the property. The tick is
   drawn as a `::before` pseudo-element, the strongest possible case of an element a consumer cannot
   reach: no `className` gets near it, so a value overriding it would have to fight a utility class on
   an element that is not in the tree at all, and the value therefore needs a name. With `rule` that is
   three names a brand re-points to get a different marker, and no member of Checklist gains a prop. */
const TICK = `:root {
  --tick-length: 0.9rem;
  --tick-thickness: 1px;
}`;

const toKebabCase = (name: string): string =>
  name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

const declarations = (
  tokens: PaletteTokens,
  value: (name: string) => string,
): string =>
  Object.keys(tokens)
    .map((name) => `  --color-${toKebabCase(name)}: ${value(name)};`)
    .join('\n');

/**
 * Renders the stylesheet form of the palette. Shared by the build script and the test that pins
 * `src/tokens.css` to it, so a palette edit that was never regenerated fails the suite instead of
 * silently shipping stale colours.
 */
export const renderTokens = (): string => {
  // The library no longer declares --color-ring but still reads it as a fallback, so a consumer's
  // existing value keeps working; the plain hex in the palette is the default and what the contrast
  // test checks. See docs/adr/0002-focus-ring-token-contract.md.
  const raw = (tokens: PaletteTokens) => (name: string) => {
    const value = tokens[name as keyof PaletteTokens];
    return name === 'focusRing' ? `var(--color-ring, ${value})` : value;
  };
  const reference = () => (name: string) => `var(--color-${toKebabCase(name)})`;

  return `${GENERATED_HEADER}

/* Dark mode is driven by a \`.dark\` class rather than prefers-color-scheme, so a story or a
   screenshot can be taken under either theme on demand. */
@custom-variant dark (&:where(.dark, .dark *));

:root {
${declarations(light, raw(light))}
}

.dark {
${declarations(dark, raw(dark))}
}

@theme inline {
${declarations(light, reference())}
}

/* Motion is not a colour: it is carried in :root only, never mapped into @theme inline. */
${MOTION}

/* The focus ring's dimensions are not colours either, and sit in :root beside the motion block. */
${FOCUS_RING}

/* Radius is not a colour either: one token for the corner every control reads, beside the others. */
${RADIUS}

/* The control minimum width is not a colour either, and sits in :root beside radius. */
${CONTROL_MIN_WIDTH}

/* The library's underline dimensions are not colours either, and sit in :root beside radius. They are
   not prose's alone: every Link treatment that draws a line draws it from these (docs/adr/0006). */
${UNDERLINE}

/* Typography is a set of Tailwind theme namespaces, not colours: its own @theme block generates the
   utilities, so it is not carried in @theme inline with the palette. */
${TYPOGRAPHY}

/* The aspect roles are Tailwind theme namespaces like typography, so they take their own @theme block
   after it and are not carried in @theme inline with the palette. */
${ASPECT}

/* The reading measure has no Tailwind namespace, so it sits in :root beside radius. */
${MEASURE}

/* Spacing has no Tailwind namespace either - --spacing is a single base multiplier ADR 0004 forbids
   re-pointing - so the three roles sit in :root beside the measure. */
${SPACING}

/* The gutter has no Tailwind namespace either, so it sits in :root beside the space roles. */
${GUTTER}

/* The fold height has no Tailwind namespace either, so it sits in :root beside the gutter. */
${FOLD}

/* The checklist tick's dimensions are not colours either, and sit in :root beside the underline block. */
${TICK}
`;
};
