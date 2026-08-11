import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// The reading column. It caps every child at --measure and sets no font-size, so the ch measure
// keeps resolving against inherited body type - the same rule Form follows when it takes the measure.
// The sibling gap is the type-scale --space-stack, never a one-idea-per-screen gap: the air the block
// wants is at its edges (the 66ch measure) and inside the type, not between the blocks. It sets no
// margin, so the page - not the component - owns the vertical rhythm around the column.
const proseRoot = cva(
  'flex max-w-[var(--measure)] flex-col gap-[var(--space-stack)]',
);

// The opening paragraph, at the new lede role: larger than body and led tighter (docs/adr/0004), but
// still running-text leading, not a heading's. Colour is the foreground token, re-pointed by `.dark`.
const proseLede = cva('font-primary text-lede leading-lede text-foreground');

// The body role inside the column - the same utilities P emits, restated because the no-cross-import
// rule forbids reusing P's recipe. A test pins the two equal so they cannot drift. Colour is a
// semantic token re-pointed by `.dark`, so no variant carries a `dark:` class.
const proseBody = cva('font-primary text-body leading-body', {
  variants: {
    color: { foreground: 'text-foreground', muted: 'text-muted' },
  },
  defaultVariants: { color: 'foreground' },
});

// The stepped-down closing note: the small role, always muted. small carries the enforced 15px floor.
const proseTail = cva('font-primary text-small text-muted');

interface IProseRootProps {
  children?: ReactNode;
  testId?: string;
}

interface IProseLedeProps {
  children?: ReactNode;
}

interface IProseBodyProps extends VariantProps<typeof proseBody> {
  children?: ReactNode;
}

interface IProseTailProps {
  children?: ReactNode;
}

const ProseRoot: FunctionComponent<IProseRootProps> = ({
  children,
  testId,
}) => (
  <div className={proseRoot()} data-testid={testId}>
    {children}
  </div>
);

const ProseLede: FunctionComponent<IProseLedeProps> = ({ children }) => (
  <p className={proseLede()}>{children}</p>
);

const ProseBody: FunctionComponent<IProseBodyProps> = ({ color, children }) => (
  <p className={proseBody({ color })}>{children}</p>
);

const ProseTail: FunctionComponent<IProseTailProps> = ({ children }) => (
  <p className={proseTail()}>{children}</p>
);

/**
 * A measure-bounded reading block: a lede, body paragraphs and an optional stepped-down muted tail,
 * all capped at the reading measure - including inside a wider grid cell, which follows from `Root`
 * bounding the column. Composed from the four members; the consumer supplies the copy.
 *
 * @Guarantees — enforced on every render
 * - `Root` renders a `div` (never a `section`: it owns no landmark and no heading), capped at
 *   `--measure`, setting no font-size so the `ch` measure resolves against inherited body type.
 * - `Root` stacks its children on `--space-stack` and takes no outer margin: the page owns the
 *   rhythm around the block, and the air the block wants is at its edges and inside the type.
 * - `Lede` renders a `p` at the lede role; `Body` at the body role with a `foreground`/`muted`
 *   `color`; `Tail` at the small role, muted. No drop cap or other invented device.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Use `Prose.Body` for a paragraph inside this reading column; for a paragraph with no reading
 *   column around it - in a form, a card, a table cell - use `P` instead.
 */
export const Prose = {
  Root: ProseRoot,
  Lede: ProseLede,
  Body: ProseBody,
  Tail: ProseTail,
} as const;
