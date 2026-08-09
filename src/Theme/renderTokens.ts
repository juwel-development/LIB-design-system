import { dark, light, type PaletteTokens } from './Palette';

const GENERATED_HEADER = `/* GENERATED from src/Theme/Palette.ts by \`npm run build:tokens\` - do not edit by hand.
 *
 * The raw values live in :root and .dark; the @theme inline block maps each one onto a Tailwind
 * colour so utilities resolve through the variable rather than baking a hex in. Declaring the
 * values inside @theme directly would freeze them at build time and the .dark overrides would
 * never reach the utilities. */`;

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
  const raw = (tokens: PaletteTokens) => (name: string) =>
    tokens[name as keyof PaletteTokens];
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
`;
};
