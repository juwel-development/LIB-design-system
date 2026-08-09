/**
 * The single source of truth for the palette: every colour the design system uses, exactly once,
 * as a plain hex string. `scripts/build-tokens.ts` renders these into `src/tokens.css` as the
 * CSS-variable layer the Tailwind utilities resolve against.
 *
 * Tokens name a *role*, never a shade. A component asks for `primary` or `muted` and never for a
 * step on a numeric ramp, so a product can re-theme the whole system by supplying its own values
 * for these same names - which is what lets one design system serve several brands.
 *
 * Light and dark are two complete sets of the same roles rather than a set of `dark:` overrides
 * scattered through the components. A component therefore carries no dark-mode classes at all:
 * swapping the `.dark` class re-points the variables underneath it.
 *
 * The values below are still depot-tracker's brand (primary is its violet). They are carried over
 * so nothing changed visually during the extraction - a starting point to replace, not a decision.
 */
export type PaletteTokens = {
  /** Page and panel background. */
  surface: string;
  /** Default text colour on `surface`. */
  foreground: string;
  /** De-emphasised text - captions, help text, placeholders. */
  muted: string;
  /** Hairlines and dividers. */
  border: string;

  /** The main call-to-action fill. */
  primary: string;
  primaryHover: string;
  /** Text and icons drawn on top of `primary`. */
  primaryForeground: string;
  /** Focus ring for primary surfaces - lighter than the fill so it reads against it. */
  primaryRing: string;

  /** The alternative action fill, for choices that sit beside a primary one. */
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;
  secondaryRing: string;

  /** Fill for controls that cannot be interacted with. */
  disabled: string;
  /** Kept distinct from `disabled` so a disabled control still absorbs hover rather than
   *  appearing to respond to it. */
  disabledHover: string;

  /** Focus ring for surfaces that have no fill of their own, such as a ghost button. */
  ring: string;

  /** Status colours. Not yet consumed by a component - they complete the role set so the
   *  first Alert or Toast has names to reach for instead of inventing them. */
  success: string;
  warning: string;
  error: string;
  info: string;
};

export const light: PaletteTokens = {
  surface: '#ffffff',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',

  primary: '#8b5cf6',
  primaryHover: '#7c3aed',
  primaryForeground: '#f8fafc',
  primaryRing: '#a78bfa',

  secondary: '#0ea5e9',
  secondaryHover: '#0284c7',
  secondaryForeground: '#f8fafc',
  secondaryRing: '#38bdf8',

  disabled: '#94a3b8',
  disabledHover: '#64748b',

  ring: '#94a3b8',

  success: '#10b981',
  warning: '#f59e0b',
  error: '#d63384',
  info: '#06b6d4',
};

/**
 * Dark reverses the ramp the fills are drawn from: `primary` takes the step that light uses for
 * its hover, and hovering steps *up* into light. That is what the components' old
 * `dark:bg-primary-600 dark:hover:bg-primary-500` pair encoded, moved here so it is stated once
 * for the whole system instead of repeated per component.
 */
export const dark: PaletteTokens = {
  surface: '#0f172a',
  foreground: '#f8fafc',
  muted: '#94a3b8',
  border: '#334155',

  primary: '#7c3aed',
  primaryHover: '#8b5cf6',
  primaryForeground: '#f8fafc',
  primaryRing: '#a78bfa',

  secondary: '#0284c7',
  secondaryHover: '#0ea5e9',
  secondaryForeground: '#f8fafc',
  secondaryRing: '#38bdf8',

  disabled: '#475569',
  disabledHover: '#334155',

  ring: '#64748b',

  success: '#34d399',
  warning: '#fbbf24',
  error: '#f48fb1',
  info: '#22d3ee',
};
