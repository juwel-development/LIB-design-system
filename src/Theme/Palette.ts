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
  /** The boundary of a control with no fill of its own, so it is the only thing separating the
   *  control from the surface. Constraint (WCAG 2.2 SC 1.4.11): at least 3:1 against `surface`
   *  in the same theme. */
  controlBorder: string;
  /** The structural rule that makes a block read as a table rather than a list: the heavier top
   *  line above the first row, weightier than `border`'s hairline dividers and lighter than
   *  `controlBorder`'s control edge. A mid-neutral, so it structures without boxing. Constraint:
   *  at least 3:1 against `surface` in the same theme. */
  rule: string;
  /** The plate behind content that has not painted - an image still loading, or one that failed and
   *  is showing its alt text. Constraint: at least 4.5:1 against `foreground` in the same theme,
   *  because a failed image renders its alt text on this plate and that text must stay legible. That
   *  keeps it near `surface` rather than a mid grey. */
  backing: string;

  /** The main call-to-action fill. */
  primary: string;
  primaryHover: string;
  /** Text and icons drawn on top of `primary`. */
  primaryForeground: string;

  /** The alternative action fill, for choices that sit beside a primary one. */
  secondary: string;
  secondaryHover: string;
  secondaryForeground: string;

  /** The tone a control takes when it cannot be interacted with - its fill, or its border when
   *  the fill is transparent. */
  disabled: string;
  /** Kept distinct from `disabled` so a disabled control still absorbs hover rather than
   *  appearing to respond to it. */
  disabledHover: string;

  /** The one focus ring, drawn by every focusable primitive regardless of variant - a focus ring
   *  states keyboard position, not the control's importance. Constraint (WCAG 2.2 SC 1.4.11): at
   *  least 3:1 against `surface` in the same theme. */
  focusRing: string;

  /** The colour of a prose link. A link is told apart by its underline, never by hue, so this
   *  carries the text threshold, not the 3:1 the ring takes. Constraint (WCAG 2.2 SC 1.4.3): at
   *  least 4.5:1 against `surface` in the same theme. */
  link: string;

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
  controlBorder: '#64748b',
  rule: '#808fa3',
  backing: '#f1f5f9',

  primary: '#8b5cf6',
  primaryHover: '#7c3aed',
  primaryForeground: '#f8fafc',

  secondary: '#0ea5e9',
  secondaryHover: '#0284c7',
  secondaryForeground: '#f8fafc',

  disabled: '#94a3b8',
  disabledHover: '#64748b',

  focusRing: '#475569',

  link: '#2563eb',

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
  controlBorder: '#94a3b8',
  rule: '#5b6a80',
  backing: '#1e293b',

  primary: '#7c3aed',
  primaryHover: '#8b5cf6',
  primaryForeground: '#f8fafc',

  secondary: '#0284c7',
  secondaryHover: '#0ea5e9',
  secondaryForeground: '#f8fafc',

  disabled: '#475569',
  disabledHover: '#334155',

  focusRing: '#cbd5e1',

  link: '#60a5fa',

  success: '#34d399',
  warning: '#fbbf24',
  error: '#f48fb1',
  info: '#22d3ee',
};
