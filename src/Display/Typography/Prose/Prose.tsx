import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import {
  createContext,
  type FunctionComponent,
  type ReactNode,
  useContext,
} from 'react';

// Root sets letter family and size to resolve its ch measure, but leaves leading inherited so
// Tail keeps its existing line height. Letter leading belongs only to Body (ADR 0004).
const proseRoot = cva('flex flex-col gap-[var(--space-stack)]', {
  variants: {
    variant: {
      default: 'max-w-[var(--measure)]',
      letter:
        'min-w-0 max-w-[min(100%,var(--measure-letter))] font-letter text-letter',
    },
  },
  defaultVariants: { variant: 'default' },
});

const LetterContext = createContext(false);

// The opening paragraph, at the new lede role: larger than body and led tighter (docs/adr/0004), but
// still running-text leading, not a heading's. Colour is the foreground token, re-pointed by `.dark`.
const proseLede = cva('font-body text-lede leading-lede text-foreground');

// The body role inside the column - the same utilities P emits, restated because the no-cross-import
// rule forbids reusing P's recipe. A test pins the two equal so they cannot drift. Colour is a
// semantic token re-pointed by `.dark`, so no variant carries a `dark:` class.
const proseBody = cva('', {
  variants: {
    letter: {
      false: 'font-body text-body leading-body',
      true: 'font-letter text-letter leading-letter',
    },
    color: {
      foreground: 'text-foreground',
      muted: 'text-muted',
      success: 'text-success',
      warning: 'text-warning',
      error: 'text-error',
      info: 'text-info',
    },
  },
  defaultVariants: { letter: false, color: 'foreground' },
});

// The stepped-down closing note: the small role, always muted. small carries the enforced 15px floor.
const proseTail = cva('font-body text-small text-muted');

export interface IProseRootProps extends VariantProps<typeof proseRoot> {
  children?: ReactNode;
  testId?: string;
}

interface IProseLedeProps {
  children?: ReactNode;
}

interface IProseBodyProps
  extends Pick<VariantProps<typeof proseBody>, 'color'> {
  children?: ReactNode;
}

interface IProseTailProps {
  children?: ReactNode;
}

const ProseRoot: FunctionComponent<IProseRootProps> = ({
  children,
  testId,
  variant,
}) => (
  <LetterContext value={variant === 'letter'}>
    <div className={proseRoot({ variant })} data-testid={testId}>
      {children}
    </div>
  </LetterContext>
);

const ProseLede: FunctionComponent<IProseLedeProps> = ({ children }) => (
  <p className={proseLede()}>{children}</p>
);

const ProseBody: FunctionComponent<IProseBodyProps> = ({ color, children }) => (
  <p className={proseBody({ color, letter: useContext(LetterContext) })}>
    {children}
  </p>
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
 * - Ordinary `Root` renders a `div` (never a `section`: it owns no landmark and no heading), capped at
 *   `--measure`, setting no font-size so the `ch` measure resolves against inherited body type.
 * - `Root variant="letter"` selects --measure-letter resolved against its own letter family and
 *   size, capped by available width. Body uses --text-letter and --leading-letter, and --font-letter
 *   falling back to --font-primary at the element. Lede and Tail keep their explicit roles.
 * - `Root` stacks its children on `--space-stack` and takes no outer margin: the page owns the
 *   rhythm around the block, and the air the block wants is at its edges and inside the type.
 * - `Lede` renders a fixed-foreground `p` at the lede role; `Body` at the selected root's role with a
 *   `foreground`, `muted`, `success`, `warning`, `error` or `info` `color`; `Tail` at the small
 *   role, always muted. A status tone changes colour only and adds no announcement semantics.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - Use Body throughout a letter, including the consumer-worded salutation and signature.
 * - Use `Prose.Body` for a paragraph inside this reading column; for a paragraph with no reading
 *   column around it - in a form, a card, a table cell - use `P` instead.
 * - Status-toned content communicates its status without relying on colour. The caller owns any
 *   announcement behavior required when that status changes.
 */
export const Prose = {
  Root: ProseRoot,
  Lede: ProseLede,
  Body: ProseBody,
  Tail: ProseTail,
} as const;
