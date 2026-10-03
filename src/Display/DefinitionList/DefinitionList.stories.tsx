import { Button } from 'Interaction/Button/Button';
import { Dialog } from 'Layout/Dialog/Dialog';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  type ComponentProps,
  type FunctionComponent,
  useEffect,
  useState,
} from 'react';
import { Subject } from 'rxjs';
import { DefinitionList } from './DefinitionList';

const meta: Meta<typeof DefinitionList.Root> = {
  title: 'Display/DefinitionList',
  component: DefinitionList.Root,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    density: {
      control: { type: 'radio' },
      options: ['comfortable', 'compact'],
      description:
        "comfortable (default) sets glossary terms at the subtitle role and keys its columns on the viewport; compact is the fact-list treatment, keyed on the list's own container",
    },
  },
};

/** Short workshop facts - the shape the compact treatment exists for. Wording is the story's. */
const Facts: FunctionComponent<ComponentProps<typeof DefinitionList.Root>> = (
  props,
) => (
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
    <DefinitionList.Item>
      <DefinitionList.Term>Deposit</DefinitionList.Term>
      <DefinitionList.Description>310.00 €</DefinitionList.Description>
    </DefinitionList.Item>
  </DefinitionList.Root>
);

/** A content-extent Dialog carrying compact facts; a button opens it so the docs page stays usable. */
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
        <Dialog.Content>
          <Facts density={'compact'} />
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

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The default: single column below 64rem, two baseline-aligned columns at and above it. Resize the
 * canvas across 64rem to see the switch - it is a media query, not a prop.
 */
export const Default: Story = {
  render: () => (
    <DefinitionList.Root>
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
};

/** A single item, showing the hairline above and below and the term-above-description stack. */
export const SingleItem: Story = {
  render: () => (
    <DefinitionList.Root>
      <DefinitionList.Item>
        <DefinitionList.Term>Moulding</DefinitionList.Term>
        <DefinitionList.Description>
          Forming a part against a shaped tool, the reverse of the surface it
          leaves behind.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

/** Several terms sharing one description - the case the Item wrapper exists to keep intact. */
export const MultipleTerms: Story = {
  render: () => (
    <DefinitionList.Root>
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
  ),
};

/** A long description in the comfortable default: it wraps at the reading measure, under its term. */
export const LongValue: Story = {
  render: () => (
    <DefinitionList.Root>
      <DefinitionList.Item>
        <DefinitionList.Term>Provenance</DefinitionList.Term>
        <DefinitionList.Description>
          Quarter-sawn European oak from a single felled tree, air-dried for
          three years in the yard behind the workshop before it was milled, so
          every board in the piece shares one figure and one movement, and
          seasoned a further winter indoors before any joint was cut.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Finish</DefinitionList.Term>
        <DefinitionList.Description>
          Hard wax oil, two coats, buffed between.
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

/**
 * The comfortable default inside a narrow holder on a wide canvas. Its columns key on the viewport,
 * as they always have, so the fixed term track opens here regardless of the holder: this is the case
 * `density="compact"` exists for, kept so the two can be compared side by side.
 */
export const ComfortableInNarrowContainer: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '22rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  render: () => <Facts />,
};

/**
 * Compact density: the fact-list treatment. Terms at the label role, values at the small role with
 * tabular figures, item air from `--space-definition-item-compact`, and two proportional columns
 * that key on the list's own container rather than the viewport.
 */
export const Compact: Story = {
  args: { density: 'compact' },
  render: (args) => <Facts {...args} />,
};

/** A compact value a sentence long, and one with no break opportunity at all, both inside a 24rem holder. */
export const CompactLongValue: Story = {
  decorators: [
    (Story) => (
      <div style={{ width: '24rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <DefinitionList.Root density={'compact'}>
      <DefinitionList.Item>
        <DefinitionList.Term>Material</DefinitionList.Term>
        <DefinitionList.Description>Oak</DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Provenance</DefinitionList.Term>
        <DefinitionList.Description>
          Quarter-sawn European oak from a single felled tree, air-dried for
          three years before it was milled, so every board shares one figure.
        </DefinitionList.Description>
      </DefinitionList.Item>
      <DefinitionList.Item>
        <DefinitionList.Term>Batch</DefinitionList.Term>
        <DefinitionList.Description>
          WERKSTATT-2026-EICHE-VIERTELGESCHNITTEN-0042
        </DefinitionList.Description>
      </DefinitionList.Item>
    </DefinitionList.Root>
  ),
};

/**
 * The same compact list in holders of three widths on one canvas. Below a 24rem container the term
 * sits above its value in one column; at and above it the two proportional columns open. The
 * dashed outline marks each holder and is the story's, not the component's.
 */
export const CompactNarrowContainers: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
      {['14rem', '22rem', '30rem'].map((width) => (
        <div
          key={width}
          data-holder={width}
          style={{ width, outline: '1px dashed #94a3b8', outlineOffset: 4 }}
        >
          <Facts density={'compact'} />
        </div>
      ))}
    </div>
  ),
};

/** Compact facts inside a content-extent Dialog, the consumer's second site: the list answers to the Dialog's width. */
export const CompactInContentDialog: Story = {
  render: () => <DialogFacts />,
};
