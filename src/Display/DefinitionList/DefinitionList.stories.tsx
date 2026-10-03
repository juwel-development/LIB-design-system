import { ColumnLayout } from 'Arrangement/ColumnLayout/ColumnLayout';
import { Box } from 'Display/Box/Box';
import { P } from 'Display/Typography/P/P';
import { Button } from 'Interaction/Button/Button';
import { Link } from 'Interaction/Link/Link';
import { Dialog } from 'Layout/Dialog/Dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ComponentProps,
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { DefinitionList } from './DefinitionList';

// The holders stand in for the consumer: a sized block, where a theme would declare a consumer's
// own minimum-width tokens the way a product declares them on `:root`. Nothing here is a prop.
type HolderStyle = CSSProperties & Record<`--${string}`, string>;

const Holder: FunctionComponent<{
  width: string;
  style?: HolderStyle;
  testId?: string;
  children: ReactNode;
}> = ({ width, style, testId, children }) => (
  <div style={{ ...style, width, maxWidth: '100%' }} data-testid={testId}>
    {children}
  </div>
);

type RootProps = ComponentProps<typeof DefinitionList.Root>;

/** Short workshop facts - the shape the compact treatment exists for. Wording is the story's. */
const Facts: FunctionComponent<RootProps> = (props) => (
  <DefinitionList.Root {...props}>
    <DefinitionList.Item>
      <DefinitionList.Term>Material</DefinitionList.Term>
      <DefinitionList.Description>Quarter-sawn oak</DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Finish</DefinitionList.Term>
      <DefinitionList.Description>Hard wax oil</DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Lead time</DefinitionList.Term>
      <DefinitionList.Description>6 weeks</DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Price</DefinitionList.Term>
      <DefinitionList.Description>1,240.00 €</DefinitionList.Description>
    </DefinitionList.Item>
  </DefinitionList.Root>
);

const itemsOf = (list: HTMLElement): HTMLElement[] =>
  Array.from(list.children).filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );

const termsOf = (item: HTMLElement): HTMLElement[] =>
  Array.from(item.querySelectorAll(':scope > dt'));

const descriptionOf = (item: HTMLElement): HTMLElement => {
  const description = item.querySelector(':scope > dd');
  if (!(description instanceof HTMLElement)) throw new Error('no dd');
  return description;
};

const widthOf = (element: HTMLElement): number =>
  element.getBoundingClientRect().width;

// Two columns: in every item the description starts to the right of every term, shares the first
// term's row, and the terms sit under one another in the term column.
const isTwoColumns = (list: HTMLElement): boolean =>
  itemsOf(list).every((item) => {
    const terms = termsOf(item).map((term) => term.getBoundingClientRect());
    const description = descriptionOf(item).getBoundingClientRect();
    return terms.every(
      (term, index) =>
        term.right <= description.left &&
        description.top < term.bottom &&
        (index === 0 || (terms[index - 1]?.bottom ?? 0) <= term.top),
    );
  });

// Stacked: in every item each term and the description take the list's full width, one below the
// other, in reading order.
const isStacked = (list: HTMLElement): boolean => {
  const width = widthOf(list);
  return itemsOf(list).every((item) => {
    const boxes = [...termsOf(item), descriptionOf(item)].map((member) =>
      member.getBoundingClientRect(),
    );
    return boxes.every(
      (box, index) =>
        Math.abs(box.width - width) < 0.5 &&
        (index === 0 || (boxes[index - 1]?.bottom ?? 0) <= box.top),
    );
  });
};

// The tracks are read from the geometry: the term track is the dt's width, the description track
// runs from the dd's left edge to the item's right edge (the dd itself is measure-capped), and the
// gap is what lies between them. Chrome reports the recipe's `max()` expression for `column-gap`.
const expectProportions = async (
  list: HTMLElement,
  weights: readonly [number, number],
): Promise<void> => {
  await expect(isTwoColumns(list)).toBe(true);
  const total = weights[0] + weights[1];
  for (const item of itemsOf(list)) {
    const term = termsOf(item)[0];
    if (!term) throw new Error('no dt');
    const bounds = item.getBoundingClientRect();
    const descriptionLeft = descriptionOf(item).getBoundingClientRect().left;
    const gap = descriptionLeft - term.getBoundingClientRect().right;
    const remainder = bounds.width - gap;
    await expect(
      Math.abs(widthOf(term) - (remainder * weights[0]) / total),
    ).toBeLessThan(0.5);
    await expect(
      Math.abs(
        bounds.right - descriptionLeft - (remainder * weights[1]) / total,
      ),
    ).toBeLessThan(0.5);
  }
};

const fitsInside = (list: HTMLElement): boolean => {
  const bounds = list.getBoundingClientRect();
  return (
    list.scrollWidth <= list.clientWidth + 1 &&
    Array.from(list.querySelectorAll('dt, dd')).every(
      (member) => member.getBoundingClientRect().right <= bounds.right + 0.5,
    )
  );
};

const noPageOverflow = (): boolean =>
  document.documentElement.scrollWidth <= document.documentElement.clientWidth;

// The list's own threshold, resolved by the browser from the custom property the Root writes.
const thresholdOf = (list: HTMLElement): number => {
  const probe = document.createElement('div');
  probe.style.width = 'var(--definition-threshold)';
  list.append(probe);
  const threshold = probe.getBoundingClientRect().width;
  probe.remove();
  return threshold;
};

const meta: Meta<typeof DefinitionList.Root> = {
  title: 'Display/DefinitionList',
  component: DefinitionList.Root,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A typeset list of terms and their descriptions whose rules are the layout. \`Root\` renders the
\`dl\`, \`Item\` the grouping \`div\`, \`Term\` a \`dt\` and \`Description\` a \`dd\`; the consumer
composes the four and owns every word. Several \`Term\`s may share one \`Description\` inside one
\`Item\`.

\`\`\`tsx
<DefinitionList.Root density="compact">
  <DefinitionList.Item>
    <DefinitionList.Term>Genre</DefinitionList.Term>
    <DefinitionList.Description>Folk</DefinitionList.Description>
  </DefinitionList.Item>
</DefinitionList.Root>
\`\`\`

**Density.** \`density\` is \`comfortable\` (the default) or \`compact\`, chosen per list. It
changes the air inside each item and nothing else: comfortable pads from
\`--space-definition-item\` (\`1.5rem\`), compact from \`--space-definition-item-compact\`
(\`0.5rem\`). Typography, hairlines, markup and the dimensions of anything composed into a
description are the same at both. Choose by what the list holds - a glossary reads comfortable,
short facts beside their labels in a panel or a content Dialog read compact.

**Allocation.** Every item shares one two-column allocation, chosen once on \`Root\`. Each column is
a positive relative \`weight\` and the name of a theme token holding its minimum readable width:
\`termColumn={{ weight: 1, minWidth: '--summary-term-min-width' }}\`. Omitted, the term column is
weight \`1\` with \`--definition-term-min-width\` (\`9rem\`) and the description column weight \`2\`
with \`--definition-description-min-width\` (\`10rem\`); either can be given alone. Weights are
structural relationships, never pixel targets; a \`minWidth\` is a custom-property name, never a
length or a \`var()\`, and a consumer's own token is declared in the theme with a nonnegative CSS
length. A non-positive or non-finite weight, or a \`minWidth\` that is not a token name, throws
\`DefinitionListConfigurationError\`; a token that is named but never declared is not a responsive
configuration - the threshold has nothing to compare and the list stays stacked at every width.

**Container adaptation.** The list measures its own width, never the viewport. The width left after
the column gap is divided in proportion to the weights; the row holds while both shares are at least
their minimums, and the moment one falls short every item in the list puts its terms above its
description at the full width. There is no in-between, and the minimum decides the switch rather
than flooring a width: for column gap \`g\`, total weight \`S\` and minimums \`m_i\` the row fits at
and above \`g + max(m_i * S / w_i)\` - \`g + 27rem\` at the defaults. The default term
minimum keeps a single-word term of about eight characters whole at the largest subtitle size; a
glossary of longer terms re-points \`--definition-term-min-width\`, and a word wider than its
column still breaks rather than overflow. A narrow list on a wide screen
therefore stacks while a wide one beside it keeps its columns, and a theme that re-points a minimum
at any scope moves the threshold. Long phrases and unbroken values wrap inside their column; nothing
is truncated and the list never widens past its holder.

**Holders.** Give the list a definite width - a block, a grid track, a \`Box\`, a Dialog's content
region. Inside a shrink-to-fit frame an inline-size container contributes no width of its own. The
two-column pin is a container style query (Chrome 111, Safari 18, Firefox 151); in a browser without
them every description sits below its terms at the full width, the terms in the term column's width.

**Tokens.** \`--space-definition-item\`, \`--space-definition-item-compact\`,
\`--definition-term-min-width\` and \`--definition-description-min-width\` are declared in all three
token stylesheets and accept a nonnegative CSS length. Hairlines use \`--color-border\`; the stacked
term-to-description gap is \`--space-stack\` and the column gap \`--space-definition-column\` (3rem, preserving comfortable spacing). There is no
size, measure, gap or per-item prop.
`,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    density: {
      control: { type: 'radio' },
      options: ['comfortable', 'compact'],
      description:
        'comfortable (the default) pads items from --space-definition-item, compact from --space-definition-item-compact; nothing else changes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default: a glossary at comfortable density. Two baseline-aligned columns in a 1:2 allocation
 * wherever the list is wide enough for both minimums, terms above descriptions where it is not.
 * Resize the canvas, or the holder, to see the switch - it answers to the list's width.
 */
export const Default: Story = {
  render: () => (
    <DefinitionList.Root testId={'list'}>
      <DefinitionList.Item>
        <DefinitionList.Term>Casting</DefinitionList.Term>
        <DefinitionList.Description>
          Shaping metal or resin by pouring it into a form and letting it set.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Turning</DefinitionList.Term>
        <DefinitionList.Description>
          Cutting a rotating workpiece on a lathe to a round profile.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Finishing</DefinitionList.Term>
        <DefinitionList.Description>
          The last passes that bring a surface to its final texture and
          tolerance.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    if (widthOf(list) >= thresholdOf(list)) {
      await expectProportions(list, [1, 2]);
    } else {
      await expect(isStacked(list)).toBe(true);
    }
    await expect(fitsInside(list)).toBe(true);
  },
};

/** A single item, showing the hairline above and below. */
export const SingleItem: Story = {
  render: () => (
    <DefinitionList.Root testId={'list'}>
      <DefinitionList.Item testId={'item'}>
        <DefinitionList.Term>Moulding</DefinitionList.Term>
        <DefinitionList.Description>
          Forming a part against a shaped tool, the reverse of the surface it
          leaves behind.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByTestId('list');
    await expect(itemsOf(list)).toHaveLength(1);
    if (widthOf(list) >= thresholdOf(list)) {
      await expectProportions(list, [1, 2]);
    } else {
      await expect(isStacked(list)).toBe(true);
    }
    const item = canvas.getByTestId('item');
    await expect(
      Number.parseFloat(getComputedStyle(item).borderTopWidth),
    ).toBeGreaterThan(0);
    await expect(
      Number.parseFloat(getComputedStyle(item).borderBottomWidth),
    ).toBeGreaterThan(0);
  },
};

/** Several terms sharing one description - the case the Item wrapper exists to keep intact. */
export const MultipleTerms: Story = {
  render: () => (
    <Holder width={'40rem'}>
      <DefinitionList.Root testId={'list'}>
        <DefinitionList.Item>
          <DefinitionList.Term>Casting</DefinitionList.Term>
          <DefinitionList.Term>Moulding</DefinitionList.Term>
          <DefinitionList.Description>
            Two names for shaping by pouring or pressing into a form and letting
            it set.
          </DefinitionList.Description>
        </DefinitionList.Item>
        <DefinitionList.Item>
          <DefinitionList.Term>Turning</DefinitionList.Term>
          <DefinitionList.Term>Milling</DefinitionList.Term>
          <DefinitionList.Description>
            Subtractive cutting - on a lathe for the first, against a rotating
            tool for the second.
          </DefinitionList.Description>
        </DefinitionList.Item>
      </DefinitionList.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    await expectProportions(list, [1, 2]);
    for (const item of itemsOf(list)) {
      await expect(termsOf(item)).toHaveLength(2);
    }
  },
};

/** An empty list: a valid, rule-less `dl` awaiting its facts, with the defaults in place. */
export const Empty: Story = {
  render: () => <DefinitionList.Root testId={'list'} />,
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    await expect(list.tagName).toBe('DL');
    await expect(list.childElementCount).toBe(0);
    await expect(list.getBoundingClientRect().height).toBe(0);
  },
};

/**
 * Compact density: the fact-list treatment for short labelled values. Only the air inside each
 * item changes, from `--space-definition-item-compact`; the type roles are the comfortable ones.
 */
export const Compact: Story = {
  args: { density: 'compact' },
  render: (args) => (
    <Holder width={'30rem'}>
      <Facts {...args} testId={'list'} />
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    await expectProportions(list, [1, 2]);
    const item = itemsOf(list)[0];
    if (!item) throw new Error('no item');
    const probe = document.createElement('div');
    probe.style.height = 'var(--space-definition-item-compact)';
    item.append(probe);
    const air = probe.getBoundingClientRect().height;
    probe.remove();
    await expect(getComputedStyle(item).paddingTop).toBe(`${air}px`);
    await expect(getComputedStyle(item).paddingBottom).toBe(`${air}px`);
  },
};

const densityTerm = (list: HTMLElement): HTMLElement => {
  const item = itemsOf(list)[0];
  const term = item && termsOf(item)[0];
  if (!term) throw new Error('no dt');
  return term;
};

/**
 * Both densities on one page, in holders of one width. Compact reduces the item air and nothing
 * else: the terms and descriptions share one typography, and both lists arrange the same way.
 */
export const Densities: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <Holder width={'30rem'}>
        <Facts testId={'comfortable'} />
      </Holder>
      <Holder width={'30rem'}>
        <Facts density={'compact'} testId={'compact'} />
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const comfortable = canvas.getByTestId('comfortable');
    const compact = canvas.getByTestId('compact');
    await expectProportions(comfortable, [1, 2]);
    await expectProportions(compact, [1, 2]);
    const comfortableItem = itemsOf(comfortable)[0];
    const compactItem = itemsOf(compact)[0];
    if (!comfortableItem || !compactItem) throw new Error('no item');
    await expect(
      Number.parseFloat(getComputedStyle(compactItem).paddingTop),
    ).toBeLessThan(
      Number.parseFloat(getComputedStyle(comfortableItem).paddingTop),
    );
    await expect(widthOf(compact)).toBe(widthOf(comfortable));
    for (const property of ['fontSize', 'fontFamily', 'lineHeight'] as const) {
      await expect(getComputedStyle(densityTerm(compact))[property]).toBe(
        getComputedStyle(densityTerm(comfortable))[property],
      );
      await expect(getComputedStyle(descriptionOf(compactItem))[property]).toBe(
        getComputedStyle(descriptionOf(comfortableItem))[property],
      );
    }
  },
};

const LongValues: FunctionComponent<RootProps> = (props) => (
  <DefinitionList.Root {...props}>
    <DefinitionList.Item>
      <DefinitionList.Term>Provenance</DefinitionList.Term>
      <DefinitionList.Description>
        Quarter-sawn European oak from a single felled tree, air-dried for three
        years in the yard behind the workshop before it was milled, so every
        board in the piece shares one figure and one movement.
      </DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Oberflächenbehandlung</DefinitionList.Term>
      <DefinitionList.Description>
        Hartwachsöl, zwei Aufträge, dazwischen poliert.
      </DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Batch</DefinitionList.Term>
      <DefinitionList.Description>
        WERKSTATT-2026-EICHE-VIERTELGESCHNITTEN-0042-NACHBESTELLUNG
      </DefinitionList.Description>
    </DefinitionList.Item>
  </DefinitionList.Root>
);

/**
 * Long English and German phrases and an unbroken value in a comfortable list wide enough for two
 * columns. Everything wraps inside its column; nothing is clipped, overlaps or widens the list.
 */
export const LongValue: Story = {
  render: () => (
    <Holder width={'36rem'}>
      <LongValues testId={'list'} />
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    await expectProportions(list, [1, 2]);
    await expect(fitsInside(list)).toBe(true);
    await expect(noPageOverflow()).toBe(true);
  },
};

/** The same values in a compact list too narrow for both minimums: stacked, still wrapping inside. */
export const CompactLongValue: Story = {
  render: () => (
    <Holder width={'20rem'}>
      <LongValues density={'compact'} testId={'list'} />
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByTestId('list');
    await expect(isStacked(list)).toBe(true);
    await expect(fitsInside(list)).toBe(true);
    await expect(noPageOverflow()).toBe(true);
  },
};

/**
 * The fit threshold at the defaults is a 3rem column gap plus `27rem`, or 480px with a 16px root.
 * Holders of 29rem and 31rem sit just below and just above it, at
 * both densities: the narrow lists stack, every item at once, and the wide ones keep their columns.
 */
export const Threshold: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: 'var(--space-region)',
        alignItems: 'start',
      }}
    >
      <Holder width={'29rem'}>
        <Facts testId={'below-comfortable'} />
      </Holder>
      <Holder width={'31rem'}>
        <Facts testId={'above-comfortable'} />
      </Holder>
      <Holder width={'29rem'}>
        <Facts density={'compact'} testId={'below-compact'} />
      </Holder>
      <Holder width={'31rem'}>
        <Facts density={'compact'} testId={'above-compact'} />
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isStacked(canvas.getByTestId('below-comfortable'))).toBe(true);
    await expect(isStacked(canvas.getByTestId('below-compact'))).toBe(true);
    await expectProportions(canvas.getByTestId('above-comfortable'), [1, 2]);
    await expectProportions(canvas.getByTestId('above-compact'), [1, 2]);
  },
};

const raisedTermMinimum: HolderStyle = {
  '--definition-term-min-width': '10rem',
};

/**
 * Lists of one width, 30rem, at both densities, half of them under a theme scope that raises the
 * term minimum from `9rem` to `10rem`. The threshold moves with the token - to one gap plus `30rem`
 * - so the themed lists stack while the default ones keep their columns.
 */
export const ThemeMinimums: Story = {
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, max-content)',
        gap: 'var(--space-region)',
        alignItems: 'start',
      }}
    >
      <Holder width={'30rem'}>
        <Facts testId={'default-comfortable'} />
      </Holder>
      <Holder width={'30rem'} style={raisedTermMinimum}>
        <Facts testId={'themed-comfortable'} />
      </Holder>
      <Holder width={'30rem'}>
        <Facts density={'compact'} testId={'default-compact'} />
      </Holder>
      <Holder width={'30rem'} style={raisedTermMinimum}>
        <Facts density={'compact'} testId={'themed-compact'} />
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectProportions(canvas.getByTestId('default-comfortable'), [1, 2]);
    await expectProportions(canvas.getByTestId('default-compact'), [1, 2]);
    await expect(isStacked(canvas.getByTestId('themed-comfortable'))).toBe(
      true,
    );
    await expect(isStacked(canvas.getByTestId('themed-compact'))).toBe(true);
  },
};

const summary: HolderStyle = {
  '--summary-term-min-width': '9rem',
  '--summary-description-min-width': '9rem',
};

/**
 * A consumer's own allocation: a 1:3 split with its own minimum tokens, declared on the holder the
 * way a theme declares them. Every item shares it whatever its content; the row fits at and above
 * one gap plus `max(9rem * 4, 9rem * 4/3)`, 36rem.
 */
export const ConsumerAllocation: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <Holder width={'40rem'} style={summary}>
        <Facts
          termColumn={{ weight: 1, minWidth: '--summary-term-min-width' }}
          descriptionColumn={{
            weight: 3,
            minWidth: '--summary-description-min-width',
          }}
          testId={'fits'}
        />
      </Holder>
      <Holder width={'36rem'} style={summary}>
        <Facts
          termColumn={{ weight: 1, minWidth: '--summary-term-min-width' }}
          descriptionColumn={{
            weight: 3,
            minWidth: '--summary-description-min-width',
          }}
          testId={'stacks'}
        />
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expectProportions(canvas.getByTestId('fits'), [1, 3]);
    await expect(isStacked(canvas.getByTestId('stacks'))).toBe(true);
  },
};

const Operable: FunctionComponent<{ testId: string }> = ({ testId }) => (
  <DefinitionList.Root density={'compact'} testId={testId}>
    <DefinitionList.Item>
      <DefinitionList.Term>Artist</DefinitionList.Term>
      <DefinitionList.Description>
        <Link href={'#marlow-vane'} treatment={'prose'}>
          {`Marlow Vane (${testId})`}
        </Link>
      </DefinitionList.Description>
    </DefinitionList.Item>
    <DefinitionList.Item>
      <DefinitionList.Term>Contract</DefinitionList.Term>
      <DefinitionList.Description>
        <Button variant={'secondary'}>{`Review (${testId})`}</Button>
      </DefinitionList.Description>
    </DefinitionList.Item>
  </DefinitionList.Root>
);

/**
 * Links and controls composed into descriptions keep their size, order and focus through the
 * switch, because the arrangement is one stylesheet rule and never reorders or remounts anything.
 * The play function tabs through both lists, then shrinks the wide holder past the threshold while
 * its button is focused.
 */
export const Keyboard: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--space-region)' }}>
      <Holder width={'30rem'} testId={'holder-wide'}>
        <Operable testId={'wide'} />
      </Holder>
      <Holder width={'20rem'}>
        <Operable testId={'narrow'} />
      </Holder>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(isTwoColumns(canvas.getByTestId('wide'))).toBe(true);
    await expect(isStacked(canvas.getByTestId('narrow'))).toBe(true);

    const wideLink = canvas.getByRole('link', { name: 'Marlow Vane (wide)' });
    const wideButton = canvas.getByRole('button', { name: 'Review (wide)' });
    const buttonHeight = wideButton.getBoundingClientRect().height;
    wideLink.focus();
    await userEvent.tab();
    await expect(document.activeElement).toBe(wideButton);
    await userEvent.tab();
    await expect(document.activeElement).toBe(
      canvas.getByRole('link', { name: 'Marlow Vane (narrow)' }),
    );
    await userEvent.tab();
    await expect(document.activeElement).toBe(
      canvas.getByRole('button', { name: 'Review (narrow)' }),
    );

    wideButton.focus();
    canvas.getByTestId('holder-wide').style.width = '20rem';
    await expect(isStacked(canvas.getByTestId('wide'))).toBe(true);
    await expect(document.activeElement).toBe(wideButton);
    await expect(wideButton.getBoundingClientRect().height).toBe(buttonHeight);
    canvas.getByTestId('holder-wide').style.width = '30rem';
    await expect(isTwoColumns(canvas.getByTestId('wide'))).toBe(true);
    await expect(document.activeElement).toBe(wideButton);
  },
};

const comparison: HolderStyle = {
  '--main-column-min-width': '28rem',
  '--support-column-min-width': '18rem',
  '--summary-term-min-width': '8rem',
  '--summary-description-min-width': '8rem',
};

/**
 * The consumer's first site: compact facts in a bounded summary panel beside a comparison, on a
 * 2:1 `ColumnLayout`, with the consumer's own minimum tokens for a panel of short labels (one gap
 * plus `24rem`). The list answers to the Box's width, not the page's, so on a wide page it keeps
 * its columns inside the one-third panel and stacks when that panel narrows past its threshold.
 */
export const InSummaryPanel: Story = {
  render: () => (
    <Holder width={'85rem'} style={comparison} testId={'page'}>
      <ColumnLayout.Root testId={'layout'}>
        <ColumnLayout.Column weight={2} minWidth={'--main-column-min-width'}>
          <P>
            The comparison the summary supports - a table in the product, a
            paragraph here.
          </P>
        </ColumnLayout.Column>
        <ColumnLayout.Column weight={1} minWidth={'--support-column-min-width'}>
          <Box name={'Selected artist'}>
            <Facts
              density={'compact'}
              termColumn={{ weight: 1, minWidth: '--summary-term-min-width' }}
              descriptionColumn={{
                weight: 2,
                minWidth: '--summary-description-min-width',
              }}
              testId={'list'}
            />
          </Box>
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </Holder>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByTestId('list');
    await expectProportions(list, [1, 2]);
    await expect(fitsInside(list)).toBe(true);
    await expect(noPageOverflow()).toBe(true);
    // At 72rem the 2:1 layout still holds (its own threshold is 55.5rem) but the panel's third,
    // less the Box inset, is below the list's threshold: the facts stack inside the panel alone.
    canvas.getByTestId('page').style.width = '72rem';
    await expect(isStacked(list)).toBe(true);
    await expect(fitsInside(list)).toBe(true);
    await expect(noPageOverflow()).toBe(true);
  },
};

/** The wiring a confirming consumer repeats; the facts are the Dialog's content. */
const DialogFacts: FunctionComponent = () => {
  const [showDialog$] = useState(() => new Subject<boolean>());
  const [onDismiss$] = useState(() => new Subject<void>());
  const [open$] = useState(() => new Subject<void>());
  const [close$] = useState(() => new Subject<void>());
  useEffect(() => {
    const subscriptions = [
      open$.subscribe(() => showDialog$.next(true)),
      close$.subscribe(() => showDialog$.next(false)),
    ];
    return () => {
      for (const subscription of subscriptions) subscription.unsubscribe();
    };
  }, [showDialog$, open$, close$]);
  return (
    <>
      <Button onClick$={open$}>Review the order…</Button>
      <Dialog.Root
        onDismiss$={onDismiss$}
        showDialog$={showDialog$}
        extent={'content'}
      >
        <Dialog.Title>Review the order</Dialog.Title>
        <Dialog.Content testId={'content'}>
          <Facts density={'compact'} testId={'list'} />
        </Dialog.Content>
        <Dialog.Actions>
          <Button variant={'secondary'} onClick$={close$}>
            Close
          </Button>
        </Dialog.Actions>
      </Dialog.Root>
    </>
  );
};

/**
 * The consumer's second site: compact facts inside a content-extent Dialog. The list answers to the
 * Dialog's content width; focus moves into the Dialog on open and back to the trigger when it closes.
 */
export const CompactInContentDialog: Story = {
  render: () => <DialogFacts />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Review the order…' });
    trigger.focus();
    await userEvent.click(trigger);
    const dialog = await waitFor(() =>
      within(document.body).getByRole('dialog'),
    );
    const list = within(dialog).getByTestId('list');
    if (widthOf(list) >= thresholdOf(list)) {
      await expectProportions(list, [1, 2]);
    } else {
      await expect(isStacked(list)).toBe(true);
    }
    const content = within(dialog).getByTestId('content');
    await expect(widthOf(list)).toBeLessThanOrEqual(content.clientWidth);
    await expect(widthOf(list)).toBeGreaterThan(content.clientWidth * 0.8);
    await expect(fitsInside(list)).toBe(true);
    await expect(dialog.contains(document.activeElement)).toBe(true);
    // A synthetic Escape never reaches the platform's cancel path, so the play leaves through the
    // consumer's Close control; the real key is pressed in the browser evidence.
    await userEvent.click(
      within(dialog).getByRole('button', { name: 'Close' }),
    );
    await waitFor(() => expect(dialog).not.toHaveAttribute('open'));
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  },
};
