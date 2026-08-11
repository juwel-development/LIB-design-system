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
`;
};
