import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// Level fixes role: an h1 is always the display role, with no size prop to invert the ladder
// (docs/adr/0005). Weight inherits - Tailwind's preflight resets h1-h6 to font-weight: inherit, so
// the sized levels carry no weight class. --tracking-optical is the large-type correction, carried by
// the title role and above (#57), so the biggest type on the page is the first to take it. Colour is a
// semantic token re-pointed by `.dark`, so no variant carries a `dark:` class. The measure is on the
// base for the same reason the size is: the level fixes the role and the role fixes the measure, so
// --measure-display is not a value a caller picks (docs/adr/0008, #87). It is the display role's own
// bound - 36ch against the reading column's 66ch, because bigger type wants fewer characters per line
// - and it holds under every colour, so it is base and not a variant.
const h1 = cva(
  'font-primary text-display leading-display tracking-optical max-w-[var(--measure-display)]',
  {
    variants: {
      color: { foreground: 'text-foreground', muted: 'text-muted' },
    },
    defaultVariants: { color: 'foreground' },
  },
);

interface IH1Props extends VariantProps<typeof h1> {
  children: ReactNode;
  testId?: string;
}

/**
 * The page-title heading, an `h1` at the display type role.
 *
 * @Guarantees — enforced on every render
 * - Renders an `h1`; its outline level and the display role are one choice, not two (docs/adr/0005).
 * - Reads `--font-primary`, sized by `--text-display`, led by `--leading-display` and optically
 *   corrected by `--tracking-optical`, the large-type correction every role from title up carries.
 * - Bounded at `--measure-display`, the display role's own measure — narrower than the reading column
 *   because bigger type wants fewer characters per line (docs/adr/0004). The bound is the recipe's,
 *   not a caller's: the level fixes the role and the role fixes the measure, so there is no `measure`
 *   prop to select between roles (docs/adr/0008). It holds under every `color`.
 * - `color` selects the `foreground` or `muted` role; nothing else paints text.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - This is an ordinary page title, and it is also a hero's lead - `display` is the hero role, so a
 *   poster hero's `h1` is this one, placed inside a `Hero` (#17), which renders no heading of its own
 *   and leaves its slot uncapped — the display measure arrives with this heading rather than with the
 *   slot, which would cap the mark beside it too (#87).
 * - A subpage head is the exception: `PageHead` renders its own `h1` at the `title` role, the one
 *   sanctioned escape valve from level-fixes-role (docs/adr/0005). Reach for it where it fits.
 * - Heading levels descend without skipping — an `h1` is followed by an `h2`, never an `h3`.
 */
export const H1: FunctionComponent<IH1Props> = ({
  children,
  color,
  testId,
}) => (
  <h1 className={h1({ color })} data-testid={testId}>
    {children}
  </h1>
);
