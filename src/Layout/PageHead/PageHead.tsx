import { cva } from 'class-variance-authority';
import type { FunctionComponent, ReactNode } from 'react';

// One recipe on the <header>, one on each element it paints. The head is full-bleed: it carries the
// band and the gutter every page unit shares but takes no max-width and joins no grid, so it opts out
// of the index column a default Section sits in (#9) by spanning the full content width - the text, not
// the head, owns every measure. The title is the title role, one rung below the hero's display: the cap
// on out-scaling the homepage hero is the display > title token relationship renderTokens pins (ADR
// 0004/0005), never a local clamp, so tracking-optical is the head's only optical touch and no size
// literal appears. That tracking is the title role's, not this component's (#57): H2 binds to the same
// role and carries the same correction, so the role reads one way wherever it is rendered. The stack gap is --space-stack, the sibling gap Prose uses. Colours are semantic
// tokens re-pointed by `.dark`, so no `dark:` class.
const pageHead = cva(
  'flex flex-col gap-[var(--space-stack)] py-[var(--space-band)] px-[var(--gutter)]',
);

// The scale event: the title role, led and tracked as a large heading, foreground. No measure - the
// head is full-bleed and the consumer keeps titles short.
const pageHeadTitle = cva(
  'font-primary text-title leading-title tracking-optical text-foreground',
);

// The standfirst: the lede role, foreground, run one measure wider than the reading column (#18).
const pageHeadLede = cva(
  'font-primary text-lede leading-lede text-foreground max-w-[var(--measure-wide)]',
);

// The small print: the small role, muted, held to the reading measure like Prose's tail.
const pageHeadIntro = cva(
  'font-primary text-small text-muted max-w-[var(--measure)]',
);

export interface IPageHeadProps {
  /** The page title - the head's one scale event, rendered as the page's `h1` at the title role. */
  title: ReactNode;
  /** The standfirst under the title: a lede-role paragraph at a measure slightly wider than the
   *  reading column. Omit for a bare title. */
  lede?: ReactNode;
  /** The muted small-print paragraph under the lede, held to the reading measure. Omit where the head
   *  is title and lede only. */
  intro?: ReactNode;
  testId?: string;
}

/**
 * A subpage's opening: one scale event, then small print. It renders a `<header>` carrying the page's
 * `h1`, an optional lede standfirst and an optional muted intro, full-bleed over the vertical band and
 * the gutter. It arranges the three slots and owns their type roles; the consumer supplies the copy.
 *
 * @Guarantees — enforced on every render
 * - The title is an `h1` at the `title` role - one rung below the hero's `display` - so it can never
 *   out-scale the homepage hero: the cap is the `display > title` token relationship (ADR 0004/0005),
 *   not two `clamp()`s ordered by luck, and no size literal is set here.
 * - The head is full-bleed: it carries `--space-band` and `--gutter` but takes no `max-width` and joins
 *   no grid, so it opts out of the index column and spans the full content width.
 * - The lede is the `lede` role at `--measure-wide`, one measure wider than the reading column; the
 *   intro is the `small` role, muted, at `--measure`. Each measure is on the text, never on the head.
 * - Omitting `lede` or `intro` renders that paragraph not at all.
 * - It is never sticky or fixed and needs no JavaScript.
 *
 * @CallerMustEnsure — the component cannot see these and does not check them
 * - The head sits inside the page's main content (a `main`, `article` or `section`), not as a top-level
 *   child of `body`, so its `<header>` is the page head and not a second `banner` beside the shell's
 *   `Header` (#14).
 * - This head opens a subpage. The homepage hero is `PosterFold` (#17), which renders at the `display`
 *   role; reach for that where the page is the poster, not for this.
 */
export const PageHead: FunctionComponent<IPageHeadProps> = ({
  title,
  lede,
  intro,
  testId,
}) => (
  <header className={pageHead()} data-testid={testId}>
    <h1 className={pageHeadTitle()}>{title}</h1>
    {lede !== undefined && <p className={pageHeadLede()}>{lede}</p>}
    {intro !== undefined && <p className={pageHeadIntro()}>{intro}</p>}
  </header>
);
