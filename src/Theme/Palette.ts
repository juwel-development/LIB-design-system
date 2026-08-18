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
  /** The structural rule that marks where a block's structure is, weightier than `border`'s hairline
   *  dividers and lighter than `controlBorder`'s control edge. It serves three consumers: a table's
   *  heavier top line above the first row, a checklist's tick, and a page section's join to the
   *  section before it. A mid-neutral, so it structures without boxing. Constraint: at least 3:1
   *  against `surface` in the same theme. */
  rule: string;
  /** The plate behind content that has not painted - an image still loading, or one that failed and
   *  is showing its alt text. Constraint: at least 4.5:1 against `foreground` in the same theme,
   *  because a failed image renders its alt text on this plate and that text must stay legible. That
   *  keeps it near `surface` rather than a mid grey. */
  backing: string;

  /** The main call-to-action fill. A filled control draws no border, so the fill is the only thing
   *  separating the control from the surface - what `controlBorder` is for an unfilled one.
   *  Constraint (WCAG 2.2 SC 1.4.11): at least 3:1 against `surface` in the same theme,
   *  `primaryHover` included, since a hovered control has to stay identifiable too. A second
   *  constraint governs this value and `primaryHover` from the other side, stated on
   *  `primaryForeground` - the ink they carry - rather than restated here. */
  primary: string;
  primaryHover: string;
  /** Text and icons drawn on top of `primary`. Constraint (WCAG 2.2 SC 1.4.3): at least 4.5:1
   *  against both `primary` and `primaryHover` in the same theme, hover included, since a hovered
   *  control has to stay readable too. Button text is normal-weight at the `body` role, so it takes
   *  the text threshold rather than the 3:1 large-text allowance. This is what makes the ink follow
   *  the theme where the fills' own roles do not: a fill light enough to clear 3:1 against a dark
   *  surface is too light to carry near-white text, so the ink sits at the *surface's* end of the
   *  neutral range in each theme. Not required against `disabled` or `disabledHover` - a disabled
   *  control is an inactive user interface component, which SC 1.4.3 exempts. */
  primaryForeground: string;

  /** The alternative action fill, for choices that sit beside a primary one. Filled like `primary`
   *  and so identified the same way. Constraint (WCAG 2.2 SC 1.4.11): at least 3:1 against
   *  `surface` in the same theme, `secondaryHover` included. A second constraint governs this value
   *  and `secondaryHover` from the other side, stated on `secondaryForeground`. */
  secondary: string;
  secondaryHover: string;
  /** Text and icons drawn on top of `secondary`. Constraint (WCAG 2.2 SC 1.4.3): at least 4.5:1
   *  against both `secondary` and `secondaryHover` in the same theme, hover included, since a
   *  hovered control has to stay readable too. Not required against `disabled` or `disabledHover` -
   *  a disabled control is an inactive user interface component, which SC 1.4.3 exempts. Why the
   *  threshold is 4.5 and not 3, and why this makes the ink follow the theme: see
   *  `primaryForeground`, which carries the same rule for the other ramp. */
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

/**
 * The ink follows the theme, and that is what set the eight fill and ink values across both sets
 * (issue #93). Solve the window a fill has to sit in - at least 3:1 against its surface (#78) and
 * at least 4.5:1 against the ink drawn on it - and it comes out lopsided: a near-white ink is
 * unbounded above in light and leaves a window just 1.26x wide in dark, and a near-black ink is the
 * exact inverse. The reason is structural - in a dark theme a fill has to be light enough to
 * separate from a near-black surface, and a light fill wants dark text - so pinning the ink
 * near-white in both themes asks a dark fill to be both at once. That 1.26x has to hold two values,
 * rest and hover, where what shipped before it stepped 1.35x and 1.23x here and 1.35x and 1.48x in
 * dark. Letting the ink invert instead puts every value on a stock ramp step, with hover steps of
 * 1.25x and 1.27x here and 1.56x and 1.48x in dark.
 *
 * Two routes were rejected, and they are what a reader arriving here is most likely to re-propose:
 * - Keep one near-white ink in both themes and move the fills. It clears 4.5:1, but caps the dark
 *   hover at that same 1.26x - gutting the state #78 constrained hover in order to keep.
 * - Give each ramp its own ink, the same in both themes. It clears 4.5:1 only against pure black:
 *   against `#0f172a`, the dark set's own `surface`, sky-600 lands at 4.36 and fails. It also buys
 *   a light theme with white text on one button and black on the one beside it.
 */
export const light: PaletteTokens = {
  surface: '#ffffff',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  controlBorder: '#64748b',
  rule: '#808fa3',
  backing: '#f1f5f9',

  primary: '#7c3aed',
  primaryHover: '#6d28d9',
  primaryForeground: '#f8fafc',

  secondary: '#0369a1',
  secondaryHover: '#075985',
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
 * Dark reverses the direction the fills step: it sits higher up the ramp than light does and hovers
 * *up* into lighter still, where light sits lower and hovers down. That is what the components' old
 * `dark:bg-primary-600 dark:hover:bg-primary-500` pair encoded, moved here so it is stated once
 * for the whole system instead of repeated per component. The two sets no longer share a step, since
 * each theme's pair has to clear its own ink as well as its own surface (issue #93).
 *
 * The ink inverts with the ramp: slate-950 under these lighter fills, where light takes slate-50
 * under its darker ones. The pair is the two ends of the one neutral ramp the rest of the palette is
 * already built from - `#f8fafc` is slate-50, `surface` slate-900, `muted` slate-500 - rather than a
 * new colour arriving for a single job. `#020617` is also the lightest slate step that still admits
 * violet-500 and sky-600, which is what leaves this set's `secondary` pair unmoved: slate-900 draws
 * 4.22 and 4.36 against them and fails. Why the ink follows the theme at all, and the two routes
 * rejected in getting here: see the light set.
 */
export const dark: PaletteTokens = {
  surface: '#0f172a',
  foreground: '#f8fafc',
  muted: '#94a3b8',
  border: '#334155',
  controlBorder: '#94a3b8',
  rule: '#5b6a80',
  backing: '#1e293b',

  primary: '#8b5cf6',
  primaryHover: '#a78bfa',
  primaryForeground: '#020617',

  secondary: '#0284c7',
  secondaryHover: '#0ea5e9',
  secondaryForeground: '#020617',

  disabled: '#475569',
  disabledHover: '#334155',

  focusRing: '#cbd5e1',

  link: '#60a5fa',

  success: '#34d399',
  warning: '#fbbf24',
  error: '#f48fb1',
  info: '#22d3ee',
};
