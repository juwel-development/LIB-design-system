import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The letter-spaced eyebrow device: the secondary family, the label size and the label tracking, at
// weight 500 (docs/adr/0004). First consumer of --font-secondary. The tracking is a fixed style, read
// from --tracking-label so a site-wide optical curve cannot collapse it. It defaults to `muted`
// because the device is defined as muted - the one primitive to invert that default. Never sets
// font-variant-caps or -numeric: both fail silently on a face without the feature. Colour is a
// semantic token re-pointed by `.dark`, so no variant carries a `dark:` class.
const eyebrow = cva('font-secondary text-label tracking-label font-medium', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'muted' },
});

interface IEyebrowProps extends VariantProps<typeof eyebrow> {
  children: ReactNode;
  testId?: string;
}

/**
 * The eyebrow / caption device, a `p` at the label type role: the secondary family, the label size
 * and a fixed +0.14em tracking, muted. The single primitive for the one *unowned* use of the device
 * — a short tracked line standing above a section heading.
 *
 * @Guarantees — enforced on every render
 * - Renders a `p`, reading `--font-secondary`, sized by `--text-label` and tracked by
 *   `--tracking-label`, at weight 500.
 * - `color` selects the `muted` (default) or `foreground` role; nothing else paints text.
 * - Sets neither `font-variant-caps` nor `font-variant-numeric` under any prop.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - This is **not a form label**: it renders no `htmlFor` and labels no control. A labelled control
 *   uses `Input`/`TextArea`, which label themselves.
 */
export const Eyebrow: FunctionComponent<IEyebrowProps> = ({
  children,
  color,
  testId,
}) => (
  <p className={eyebrow({ color })} data-testid={testId}>
    {children}
  </p>
);
