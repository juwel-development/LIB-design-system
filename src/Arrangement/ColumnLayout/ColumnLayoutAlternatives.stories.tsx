import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, Cluster, H3, Input, Note, P, Pane, Stack, Tabs } from 'index';
import {
  type CSSProperties,
  type FunctionComponent,
  type ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from 'react';
import { BehaviorSubject, Subject } from 'rxjs';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { ColumnLayout } from './ColumnLayout';

const meta: Meta<typeof ColumnLayout.Alternatives> = {
  title: 'Arrangement/ColumnLayout Alternatives',
  component: ColumnLayout.Alternatives,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `\`ColumnLayout.Alternatives\` lets a consumer declare several arrangements of the same screen and mounts the first one its own width can hold. The consumer owns the layout: which work areas exist, which appear together, which share a tabbed surface, their order, wording and content. The library owns only the choice between the declared arrangements and the semantics of the components they are built from. It knows no area names and no grouping rules, and it has no viewport breakpoint.

\`\`\`tsx
<ColumnLayout.Alternatives fill>
  <ColumnLayout.Root fill>
    <ColumnLayout.Column key="pool" weight={1} minWidth="--work-area-min-width">{pool}</ColumnLayout.Column>
    <ColumnLayout.Column key="sides" weight={1} minWidth="--work-area-min-width">{sides}</ColumnLayout.Column>
    <ColumnLayout.Column key="release" weight={1} minWidth="--work-area-min-width">{release}</ColumnLayout.Column>
  </ColumnLayout.Root>
  <ColumnLayout.Root fill>
    <ColumnLayout.Column key="group" weight={1} minWidth="--work-area-min-width">
      <Tabs.Root fill active={active} onSelect$={select$} label={t('workAreas')}>
        <Tabs.List>…</Tabs.List>
        <Tabs.Panel value="pool">{pool}</Tabs.Panel>
        <Tabs.Panel value="release">{release}</Tabs.Panel>
      </Tabs.Root>
    </ColumnLayout.Column>
    <ColumnLayout.Column key="sides" weight={1} minWidth="--work-area-min-width">{sides}</ColumnLayout.Column>
  </ColumnLayout.Root>
</ColumnLayout.Alternatives>
\`\`\`

\`Alternatives\` takes \`children\`, \`fallback?: ReactNode\`, \`fill?: boolean\` and \`testId\`. Nothing else: no breakpoint, no width, no selected-arrangement output.

**Declaration and preference.** Each child is one \`ColumnLayout.Root\` with at least one column — written directly, in arrays or fragments, or omitted by a conditional. Their order is the preference: the first that fits is mounted, also when later ones fit too. Nothing is ranked or inferred. One declaration is a valid configuration (it is always the last one), and so is none: an empty \`Alternatives\` mounts nothing, or its fallback.

**Fit.** A declaration fits exactly when its row would hold: when the width of the \`Alternatives\` element is at least that Root's own threshold, \`(n − 1) × g + max(mᵢ × S ⁄ wᵢ)\`, for \`n\` columns, the Root's gap \`g\`, total weight \`S\`, weights \`wᵢ\` and the \`minWidth\` tokens \`mᵢ\`. Three equal columns of \`20rem\` with the region gap fit from \`60rem + 2 × --space-region\`. Equality fits; anything below does not. The comparison is the one \`ColumnLayout.Root\` itself makes, evaluated by the browser from the same tokens, so a declaration selected by fit is never stacked. The width measured is the element's own: two instances on one page select independently, and no viewport width is consulted. Because the tokens are read by the stylesheet, re-pointing a minimum or a space role — in a theme class, a media query, a scope around the element, or through a font-relative unit — selects again without a resize.

**When none fits.** With a \`fallback\`, that content is mounted. Without one (omitted, \`undefined\`, \`null\` or \`false\`), the last declared arrangement stays mounted and behaves as any \`ColumnLayout.Root\` below its threshold: its columns stack in reading order at the full width, its content wraps or scrolls under its own contracts, and the enclosing holder owns vertical scrolling. A minimum decides selection and never floors a width, so selection itself cannot cause horizontal overflow.

**Height.** With \`fill\`, the element accepts its parent's allocated height and passes it to whatever is mounted, which accepts it in turn: \`ColumnLayout.Root fill\`, \`Tabs.Root fill\`, and inside them a \`Pane\`. The chain Shell → Sidebar.Root fill → Sidebar.Content → Screen → Alternatives fill → Root fill → Column → (Tabs.Root fill → Tabs.Panel →) Pane.Root needs no consumer CSS, no height wrapper, no nested Pane and no nested Shell. Stacked columns return to content height and the enclosing body scrolls, as with any filling ColumnLayout. In an unsized parent nothing is bounded.

**Active views stay yours.** Tabs inside an arrangement are ordinary controlled \`Tabs\`. Selection is never requested because an arrangement changed or because something had focus, and no active view is remembered by the library. Keep the active key in application state the whole time — also while an arrangement without tabs is mounted — so the Tabs that mount on a change receive a valid \`active\` in the same render. When the declared views themselves change, supply the replacement \`active\` in the same update, as Tabs already requires.

**Mounting and removal.** Only the selected arrangement is mounted: there is never a second copy of an area, an id or a control, and nothing inactive is kept hidden. A width or token change that does not change the selection touches nothing. When the selection changes, a column that both arrangements declare under the same React \`key\` (or, unkeyed, at the same position) with the same element types inside stays mounted with its DOM, state and focus — the \`sides\` column above. Everything else is removed and unmounts: its subscriptions end, and focus inside it falls to the document as with any removal. Content that returns later mounts fresh. Its former focus, text selection, scroll position and local state are not restored and are not cached anywhere. State that must survive — a draft, a filter, the active view — belongs to the application, which supplies it to the fresh mount (\`defaultValue={draft}\`).

**Before the first measurement** — a server render and the first client render — no arrangement is mounted; the selection is made before the first paint. An environment without layout (jsdom) measures every declaration as fitting, so the first one is mounted there.

**Errors.** Anything among the children that is not a \`ColumnLayout.Root\` — text, another element, a component wrapping a Root — and a Root without columns throw \`ColumnLayoutConfigurationError\`, as do the invalid weights and token names \`ColumnLayout\` already rejects. Every declaration is validated, mounted or not.

**When the declarations change** — an area is added or dropped, a weight or a token name changes — what is mounted stays until the new declarations are measured, within the same update. Nothing the new declarations do not select is mounted in between, and a column kept under its \`key\` stays mounted.

**When the element's width answers to its content.** Inside a scroll body with space-taking scrollbars, mounting a preferred arrangement can cost the element the very width that arrangement needs: its content overflows, the scrollbar appears, the arrangement stops fitting, the next one restores the width, and the first fits again. \`Alternatives\` settles instead. Once the same two selections have alternated at the same two widths twice, with no more than three frames between changes, it takes the difference as its own doing: the later declaration stays mounted, and the width that was lost is held back when judging the declarations preferred to the mounted one, until the declarations change. A preferred arrangement returns once it fits with that much to spare, so it still fits after taking it. Settling mounts each of the two arrangements at most twice more. Where the element's width does not depend on its content nothing is held back and the boundary above is exact; a width that merely drops and returns — a stylesheet swapped, a panel toggled twice — is followed as usual. See *Width Feedback*.

**Caller must ensure.** Declare every \`minWidth\` token as a nonnegative length on an ancestor. Give the same area the same \`key\` in every arrangement in which it should stay mounted. A holder whose width follows the mounted arrangement only after more than three frames, or by a different amount each time — a delayed or animated dependency — is outside the contract and can alternate.`,
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof meta>;

// The stories stand in for the consumer: its theme declares the minimum usable width of a work
// area, and its holder supplies the width. Neither is a prop of the component.
type HolderStyle = CSSProperties & Record<`--${string}`, string>;

const theme: HolderStyle = { '--work-area-min-width': '10rem' };

const Holder: FunctionComponent<{
  width: string;
  style?: HolderStyle;
  testId?: string;
  children: ReactNode;
}> = ({ width, style, testId, children }) => (
  <div style={{ ...theme, ...style, width }} data-testid={testId}>
    {children}
  </div>
);

const Area: FunctionComponent<{ name: string; children?: ReactNode }> = ({
  name,
  children,
}) => (
  <Pane.Root name={name}>
    <Pane.Head>
      <H3>{name}</H3>
    </Pane.Head>
    <Pane.Body ariaLabel={`${name} content`}>
      <Stack>
        {children ?? <P>Content of the {name.toLowerCase()} area.</P>}
      </Stack>
    </Pane.Body>
  </Pane.Root>
);

const useSelection = (initial: string): [string, Subject<string>] => {
  const [active, setActive] = useState(initial);
  const [select$] = useState(() => new Subject<string>());
  useEffect(() => {
    const subscription = select$.subscribe(setActive);
    return () => subscription.unsubscribe();
  }, [select$]);
  return [active, select$];
};

// Three areas side by side, or the first and third sharing a tabbed surface beside the second.
// The areas, their order, the grouping and the active view are all the consumer's.
const WorkAreas: FunctionComponent<{
  pool?: ReactNode;
  board?: ReactNode;
  summary?: ReactNode;
  withFallback?: boolean;
  testId?: string;
}> = ({ pool, board, summary, withFallback = false, testId }) => {
  const [active, select$] = useSelection('pool');
  const areas = {
    pool: <Area name={'Pool'}>{pool}</Area>,
    board: <Area name={'Board'}>{board}</Area>,
    summary: <Area name={'Summary'}>{summary}</Area>,
  };
  const everything = (
    <Tabs.Root active={active} onSelect$={select$} label={'Work areas'}>
      <Stack gap={'stack'}>
        <Tabs.List>
          <Tabs.Tab value={'pool'}>Pool</Tabs.Tab>
          <Tabs.Tab value={'board'}>Board</Tabs.Tab>
          <Tabs.Tab value={'summary'}>Summary</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value={'pool'}>{areas.pool}</Tabs.Panel>
        <Tabs.Panel value={'board'}>{areas.board}</Tabs.Panel>
        <Tabs.Panel value={'summary'}>{areas.summary}</Tabs.Panel>
      </Stack>
    </Tabs.Root>
  );
  return (
    <ColumnLayout.Alternatives
      fallback={withFallback ? everything : undefined}
      testId={testId}
    >
      <ColumnLayout.Root>
        <ColumnLayout.Column
          key={'pool'}
          weight={1}
          minWidth={'--work-area-min-width'}
        >
          {areas.pool}
        </ColumnLayout.Column>
        <ColumnLayout.Column
          key={'board'}
          weight={1}
          minWidth={'--work-area-min-width'}
        >
          {areas.board}
        </ColumnLayout.Column>
        <ColumnLayout.Column
          key={'summary'}
          weight={1}
          minWidth={'--work-area-min-width'}
        >
          {areas.summary}
        </ColumnLayout.Column>
      </ColumnLayout.Root>
      <ColumnLayout.Root>
        <ColumnLayout.Column
          key={'group'}
          weight={1}
          minWidth={'--work-area-min-width'}
        >
          <Tabs.Root
            active={active === 'board' ? 'pool' : active}
            onSelect$={select$}
            label={'Pool and summary'}
          >
            <Stack gap={'stack'}>
              <Tabs.List>
                <Tabs.Tab value={'pool'}>Pool</Tabs.Tab>
                <Tabs.Tab value={'summary'}>Summary</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value={'pool'}>{areas.pool}</Tabs.Panel>
              <Tabs.Panel value={'summary'}>{areas.summary}</Tabs.Panel>
            </Stack>
          </Tabs.Root>
        </ColumnLayout.Column>
        <ColumnLayout.Column
          key={'board'}
          weight={1}
          minWidth={'--work-area-min-width'}
        >
          {areas.board}
        </ColumnLayout.Column>
      </ColumnLayout.Root>
    </ColumnLayout.Alternatives>
  );
};

const areaNames = (holder: HTMLElement): (string | null)[] =>
  within(holder)
    .queryAllByRole('group')
    .map((area) => area.getAttribute('aria-label'))
    .filter(
      (name) => name === 'Pool' || name === 'Board' || name === 'Summary',
    );

const tops = (holder: HTMLElement): number[] =>
  within(holder)
    .getAllByRole('group')
    .filter((area) => area.hasAttribute('aria-label'))
    .map((area) => Math.round(area.getBoundingClientRect().top));

/** Two instances in one viewport: the 40rem holder mounts the three areas, the 26rem holder the
 *  tab group beside the board. Each measures its own width; no window size takes part. */
export const Preference: Story = {
  render: () => (
    <Stack gap={'region'}>
      <Holder width={'40rem'} testId={'wide'}>
        <WorkAreas />
      </Holder>
      <Holder width={'26rem'} testId={'narrow'}>
        <WorkAreas />
      </Holder>
    </Stack>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wide = canvas.getByTestId('wide');
    const narrow = canvas.getByTestId('narrow');
    await expect(areaNames(wide)).toEqual(['Pool', 'Board', 'Summary']);
    await expect(within(wide).queryByRole('tablist')).toBeNull();
    await expect(new Set(tops(wide)).size).toBe(1);
    await expect(areaNames(narrow)).toEqual(['Pool', 'Board']);
    await expect(
      within(narrow).getByRole('tablist', { name: 'Pool and summary' }),
    ).toBeVisible();
    await expect(
      within(narrow).queryByRole('group', { name: 'Summary' }),
    ).toBeNull();
  },
};

/** The boundary is exact. With weights `2`, `1`, `1` and minimums of 12rem, 8rem and 8rem the
 *  three areas fit from `2 × gap + max(12 × 4 ⁄ 2, 8 × 4, 8 × 4)rem = 2 × gap + 32rem`. The first
 *  holder is exactly that wide and mounts them, in one row; the second is a quarter pixel short
 *  and mounts the two-area arrangement, whose own threshold is `gap + 24rem`. The gap is the
 *  declaration's own: the third holder is narrower than either, and exactly wide enough for the
 *  same three areas declared with the `stack` gap. */
export const FitBoundary: Story = {
  render: () => {
    const declarationsWith = (gap: 'region' | 'stack') => (
      <ColumnLayout.Alternatives>
        <ColumnLayout.Root gap={gap}>
          <ColumnLayout.Column weight={2} minWidth={'--pool-min-width'}>
            <Area name={'Pool'} />
          </ColumnLayout.Column>
          <ColumnLayout.Column weight={1} minWidth={'--work-area-min-width'}>
            <Area name={'Board'} />
          </ColumnLayout.Column>
          <ColumnLayout.Column weight={1} minWidth={'--work-area-min-width'}>
            <Area name={'Summary'} />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
        <ColumnLayout.Root>
          <ColumnLayout.Column weight={1} minWidth={'--pool-min-width'}>
            <Area name={'Pool'} />
          </ColumnLayout.Column>
          <ColumnLayout.Column weight={1} minWidth={'--work-area-min-width'}>
            <Area name={'Board'} />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>
    );
    const bounds: HolderStyle = {
      '--pool-min-width': '12rem',
      '--work-area-min-width': '8rem',
    };
    return (
      <Stack gap={'region'}>
        <Holder
          width={'calc(2 * var(--space-region) + 32rem)'}
          style={bounds}
          testId={'at'}
        >
          {declarationsWith('region')}
        </Holder>
        <Holder
          width={'calc(2 * var(--space-region) + 32rem - 0.25px)'}
          style={bounds}
          testId={'below'}
        >
          {declarationsWith('region')}
        </Holder>
        <Holder
          width={'calc(2 * var(--space-stack) + 32rem)'}
          style={bounds}
          testId={'at-stack-gap'}
        >
          {declarationsWith('stack')}
        </Holder>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const at = canvas.getByTestId('at');
    const below = canvas.getByTestId('below');
    await expect(areaNames(at)).toEqual(['Pool', 'Board', 'Summary']);
    await expect(new Set(tops(at)).size).toBe(1);
    await expect(areaNames(below)).toEqual(['Pool', 'Board']);
    await expect(new Set(tops(below)).size).toBe(1);
    await expect(
      at.getBoundingClientRect().width - below.getBoundingClientRect().width,
    ).toBeLessThanOrEqual(0.25);
    const atStackGap = canvas.getByTestId('at-stack-gap');
    await expect(atStackGap.getBoundingClientRect().width).toBeLessThan(
      below.getBoundingClientRect().width,
    );
    await expect(areaNames(atStackGap)).toEqual(['Pool', 'Board', 'Summary']);
    await expect(new Set(tops(atStackGap)).size).toBe(1);
  },
};

/** The holder keeps its width; only the theme changes. Re-pointing the minimum from 10rem to 16rem
 *  moves the three-area threshold past the holder, and the tab group is mounted - no resize, no
 *  rerender of the declarations. */
export const TokenChange: Story = {
  render: () => {
    const Themed: FunctionComponent = () => {
      const [isRoomy, setIsRoomy] = useState(false);
      const [toggle$] = useState(() => new Subject<void>());
      useEffect(() => {
        const subscription = toggle$.subscribe(() =>
          setIsRoomy((value) => !value),
        );
        return () => subscription.unsubscribe();
      }, [toggle$]);
      return (
        <Stack gap={'region'}>
          <Button variant={'plain'} onClick$={toggle$}>
            Re-point the minimum
          </Button>
          <Holder
            width={'40rem'}
            style={{ '--work-area-min-width': isRoomy ? '16rem' : '10rem' }}
            testId={'holder'}
          >
            <WorkAreas />
          </Holder>
        </Stack>
      );
    };
    return <Themed />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = canvas.getByTestId('holder');
    const width = holder.getBoundingClientRect().width;
    await expect(areaNames(holder)).toEqual(['Pool', 'Board', 'Summary']);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Re-point the minimum' }),
    );
    await waitFor(() => expect(areaNames(holder)).toEqual(['Pool', 'Board']));
    await expect(holder.getBoundingClientRect().width).toBe(width);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Re-point the minimum' }),
    );
    await waitFor(() =>
      expect(areaNames(holder)).toEqual(['Pool', 'Board', 'Summary']),
    );
  },
};

/** Neither arrangement fits 18rem. Without a fallback the last declaration stays and stacks as
 *  any ColumnLayout does: the tab group above the board, each at the full width, nothing
 *  overflowing sideways. With a fallback the consumer's third answer is mounted instead - here
 *  all three areas as tabs. */
export const NoneFits: Story = {
  render: () => (
    <Cluster>
      <Holder width={'18rem'} testId={'last'}>
        <WorkAreas />
      </Holder>
      <Holder width={'18rem'} testId={'fallback'}>
        <WorkAreas withFallback />
      </Holder>
    </Cluster>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const last = canvas.getByTestId('last');
    const fallback = canvas.getByTestId('fallback');
    await expect(areaNames(last)).toEqual(['Pool', 'Board']);
    const [pool, board] = within(last)
      .getAllByRole('group')
      .filter((area) => area.hasAttribute('aria-label'));
    await expect(board?.getBoundingClientRect().top).toBeGreaterThan(
      pool?.getBoundingClientRect().bottom ?? 0,
    );
    await expect(board?.getBoundingClientRect().width).toBe(
      last.getBoundingClientRect().width,
    );
    await expect(
      within(fallback).getByRole('tablist', { name: 'Work areas' }),
    ).toBeVisible();
    await expect(within(fallback).getAllByRole('tab')).toHaveLength(3);
    await expect(areaNames(fallback)).toEqual(['Pool']);
    // No area is floored at its minimum: each ends inside its 18rem holder, and the page itself
    // gains no horizontal scroll range.
    for (const holder of [last, fallback]) {
      for (const area of within(holder).getAllByRole('group')) {
        await expect(area.getBoundingClientRect().right).toBeLessThanOrEqual(
          holder.getBoundingClientRect().right,
        );
      }
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    );
  },
};

const MountCount: FunctionComponent<{ area: string }> = ({ area }) => {
  const [count] = useState(() => {
    mounts[area] = (mounts[area] ?? 0) + 1;
    return mounts[area];
  });
  return <Note>Mounted {count} time(s)</Note>;
};
// Outlives every mount on purpose: it is the consumer-side record of how often an area mounted.
const mounts: Record<string, number> = {};

/** What a selection change does to content. The board is declared under the key `board` in both
 *  arrangements, so it stays mounted: its note keeps its text and its focus. The pool and the
 *  summary move into tab panels, so they are removed and mount fresh; the summary's title comes
 *  back only because the consumer owns the draft and supplies it again, and nothing gives it its
 *  focus back. */
export const Lifecycle: Story = {
  render: () => {
    const Resizable: FunctionComponent = () => {
      const [width, setWidth] = useState('40rem');
      const [draft, setDraft] = useState('Untitled');
      const [narrow$] = useState(() => new Subject<void>());
      const [widen$] = useState(() => new Subject<void>());
      const [title$] = useState(() => new Subject<string>());
      useEffect(() => {
        const subscriptions = [
          narrow$.subscribe(() => setWidth('26rem')),
          widen$.subscribe(() => setWidth('40rem')),
          title$.subscribe(setDraft),
        ];
        return () => {
          for (const subscription of subscriptions) subscription.unsubscribe();
        };
      }, [narrow$, widen$, title$]);
      return (
        <Stack gap={'region'}>
          <Cluster>
            <Button variant={'plain'} onClick$={narrow$}>
              Narrow the holder
            </Button>
            <Button variant={'plain'} onClick$={widen$}>
              Widen the holder
            </Button>
          </Cluster>
          <Holder width={width} testId={'holder'}>
            <WorkAreas
              pool={<MountCount area={'pool'} />}
              board={
                <>
                  <MountCount area={'board'} />
                  <Input label={'Board note'} name={'note'} />
                </>
              }
              summary={
                <>
                  <MountCount area={'summary'} />
                  <Input
                    label={'Title'}
                    name={'title'}
                    defaultValue={draft}
                    onInput$={title$}
                  />
                </>
              }
            />
          </Holder>
        </Stack>
      );
    };
    return <Resizable />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = canvas.getByTestId('holder');
    const mountedIn = (area: string): string | null =>
      within(within(holder).getByRole('group', { name: area })).getByText(
        /Mounted/,
      ).textContent;
    const boardMounts = mountedIn('Board');
    const summaryMounts = mountedIn('Summary');
    const title = within(holder).getByRole('textbox', { name: 'Title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Night drive');
    const note = within(holder).getByRole('textbox', { name: 'Board note' });
    await userEvent.type(note, 'Check side B');
    await expect(note).toHaveFocus();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Narrow the holder' }),
    );
    await waitFor(() => expect(areaNames(holder)).toEqual(['Pool', 'Board']));
    await expect(
      within(holder).getByRole('textbox', { name: 'Board note' }),
    ).toBe(note);
    await expect(note).toHaveValue('Check side B');
    await expect(mountedIn('Board')).toBe(boardMounts);
    await expect(
      within(holder).queryByRole('textbox', { name: 'Title' }),
    ).toBeNull();
    await expect(canvasElement.querySelectorAll('[name="title"]')).toHaveLength(
      0,
    );

    await userEvent.click(within(holder).getByRole('tab', { name: 'Summary' }));
    const returned = await within(holder).findByRole('textbox', {
      name: 'Title',
    });
    await expect(returned).not.toBe(title);
    await expect(returned).toHaveValue('Night drive');
    await expect(returned).not.toHaveFocus();
    await expect(mountedIn('Summary')).not.toBe(summaryMounts);
    await expect(canvasElement.querySelectorAll('[name="title"]')).toHaveLength(
      1,
    );
  },
};

// Stands in for content that overflows its scroll body: while mounted it reports itself, and the
// story takes a scrollbar's width off the holder, as a classic scrollbar would.
const Overflowing: FunctionComponent<{
  present$: BehaviorSubject<boolean>;
}> = ({ present$ }) => {
  useLayoutEffect(() => {
    present$.next(true);
    return () => present$.next(false);
  }, [present$]);
  return <P>Taller than the scroll body can show.</P>;
};

/** A holder that loses width to what is mounted in it. The three areas fit the 33rem offered
 *  exactly, but mounted they cost the holder 1rem - a scrollbar - and no longer fit; the tab group
 *  gives the rem back. After two such round trips the tab group stays and the lost rem is held
 *  back from then on: with one rem more offered the three areas return, once, and hold their
 *  row at the 33rem they leave. */
export const WidthFeedback: Story = {
  render: () => {
    const Scrolled: FunctionComponent = () => {
      const [offered, setOffered] = useState(33);
      const [isOverflowing, setIsOverflowing] = useState(false);
      const [mountsOfThree, setMountsOfThree] = useState(0);
      const [present$] = useState(() => new BehaviorSubject(false));
      const [widen$] = useState(() => new Subject<void>());
      useLayoutEffect(() => {
        const subscriptions = [
          present$.subscribe((isPresent) => {
            setIsOverflowing(isPresent);
            setMountsOfThree((count) => count + Number(isPresent));
          }),
          widen$.subscribe(() => setOffered((rem) => rem + 1)),
        ];
        return () => {
          for (const subscription of subscriptions) subscription.unsubscribe();
        };
      }, [present$, widen$]);
      return (
        <Stack gap={'region'}>
          <Cluster>
            <Button variant={'plain'} onClick$={widen$}>
              Offer one rem more
            </Button>
            <Note>
              {offered}rem offered, three areas mounted {mountsOfThree} time(s)
            </Note>
          </Cluster>
          <Holder
            width={`${offered - Number(isOverflowing)}rem`}
            testId={'holder'}
          >
            <WorkAreas summary={<Overflowing present$={present$} />} />
          </Holder>
        </Stack>
      );
    };
    return <Scrolled />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const holder = canvas.getByTestId('holder');
    const still = async (): Promise<void> => {
      for (let frame = 0; frame < 12; frame++) {
        await new Promise(requestAnimationFrame);
      }
    };
    await still();
    await expect(areaNames(holder)).toEqual(['Pool', 'Board']);
    await expect(
      canvas.getByText(/33rem offered, three areas mounted 2 time/),
    ).toBeVisible();
    await expect(holder.getBoundingClientRect().width).toBe(33 * 16);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Offer one rem more' }),
    );
    await still();
    await expect(areaNames(holder)).toEqual(['Pool', 'Board', 'Summary']);
    await expect(new Set(tops(holder)).size).toBe(1);
    await expect(holder.getBoundingClientRect().width).toBe(33 * 16);
    await expect(
      canvas.getByText(/34rem offered, three areas mounted 3 time/),
    ).toBeVisible();
  },
};

/** A consumer that has only two areas to show declares only that: one arrangement, no tab group,
 *  no reserved track. It is the last declaration, so below its threshold it stacks. */
export const TwoAreas: Story = {
  render: () => {
    const twoAreas = (
      <ColumnLayout.Alternatives>
        <ColumnLayout.Root>
          <ColumnLayout.Column
            key={'board'}
            weight={1}
            minWidth={'--work-area-min-width'}
          >
            <Area name={'Board'} />
          </ColumnLayout.Column>
          <ColumnLayout.Column
            key={'summary'}
            weight={1}
            minWidth={'--work-area-min-width'}
          >
            <Area name={'Summary'} />
          </ColumnLayout.Column>
        </ColumnLayout.Root>
      </ColumnLayout.Alternatives>
    );
    return (
      <Stack gap={'region'}>
        <Holder width={'40rem'} testId={'wide'}>
          {twoAreas}
        </Holder>
        <Holder width={'18rem'} testId={'narrow'}>
          {twoAreas}
        </Holder>
      </Stack>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wide = canvas.getByTestId('wide');
    const narrow = canvas.getByTestId('narrow');
    await expect(areaNames(wide)).toEqual(['Board', 'Summary']);
    await expect(within(wide).queryByRole('tablist')).toBeNull();
    const [board, summary] = within(wide).getAllByRole('group');
    await expect(new Set(tops(wide)).size).toBe(1);
    await expect(
      Math.abs(
        (board?.getBoundingClientRect().width ?? 0) -
          (summary?.getBoundingClientRect().width ?? 0),
      ),
    ).toBeLessThan(1);
    await expect(summary?.getBoundingClientRect().right).toBeCloseTo(
      wide.getBoundingClientRect().right,
      0,
    );
    await expect(areaNames(narrow)).toEqual(['Board', 'Summary']);
    await expect(new Set(tops(narrow)).size).toBe(2);
  },
};
